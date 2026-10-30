// dprint-ignore-file
// Harper's own checks of the scaffolded workflows, copied verbatim from
// HarperFast/harper@dede2d3da9b991e7cfa8b06fc7e92ed39c96f32b bin/deploySetupGithubActions.ts
// (WorkflowCheck through checkPreviewWorkflowFile). No published release has
// checkPreviewWorkflowFile yet: replace this copy with an import once 5.4.0 is on npm. Until then,
// refresh it from the same lines of a newer commit.
import * as YAML from 'yaml';

export interface WorkflowCheck {
	problems: string[];
	unverified: string[];
	/** What could hand the identity to a fork or to a PR's code, and could not be ruled out. */
	unsafe?: string[];
}

function asList(value: unknown): unknown[] {
	if (value === undefined || value === null) return [];
	return Array.isArray(value) ? value : [value];
}

const isExpression = (value: unknown) => typeof value === 'string' && value.includes('${{');

const environmentName = (job: any) => (typeof job?.environment === 'object' ? job.environment?.name : job?.environment);

/** A job's own `permissions` replace the workflow's; with neither, GitHub's defaults grant no identity token. */
function grantsIdToken(job: any, workflow: any): boolean {
	const permissions = job?.permissions ?? workflow?.permissions;
	if (permissions === 'write-all') return true;
	return typeof permissions === 'object' && permissions !== null && permissions['id-token'] === 'write';
}

function parseWorkflow(content: string): { workflow?: any; error?: string } {
	try {
		// Failsafe keeps every scalar as written: the default schema reads `branches: [1.0]` as the number 1.
		return { workflow: YAML.parse(content, { schema: 'failsafe' }) };
	} catch (error) {
		return { error: `it is not valid YAML: ${(error as Error).message}` };
	}
}

/**
 * Checks the workflow file against the branch and environment the policy will pin. A literal value
 * that disagrees is a problem — no run of that workflow could match the policy. A value this cannot
 * read (an expression, or no filter at all) is reported as unverified rather than assumed to match.
 */
export function checkWorkflowFile(content: string, branch: string, environment: string): WorkflowCheck {
	const problems: string[] = [];
	const unverified: string[] = [];
	const { workflow, error } = parseWorkflow(content);
	if (error) return { problems: [error], unverified };
	const triggers = workflow?.on;
	const push = triggers && typeof triggers === 'object' && !Array.isArray(triggers) ? triggers.push : undefined;
	const branches = asList(push?.branches);
	const otherTriggers =
		triggers && typeof triggers === 'object' && !Array.isArray(triggers)
			? Object.keys(triggers).filter((name) => !['push', 'pull_request', 'pull_request_target'].includes(name))
			: [];
	if (branches.length === 0) {
		unverified.push(`that it deploys from "${branch}" (it has no on.push.branches filter)`);
	} else if (!branches.includes(branch)) {
		// Entries are glob patterns; matching them is GitHub's job, so a pattern is only unverified.
		if (branches.some((entry) => isExpression(entry) || /[*?[!+]/.test(String(entry)))) {
			unverified.push(`that ${branches.join(', ')} matches "${branch}"`);
		} else if (otherTriggers.length > 0) {
			// A manual, scheduled or dispatched run can run on the branch the push filter leaves out.
			unverified.push(`that "${branch}" deploys: only ${otherTriggers.join(', ')} can run it there`);
		} else {
			problems.push(`it deploys on pushes to ${branches.join(', ')}, not "${branch}"`);
		}
	}
	checkEnvironmentJobs(workflow, environment, problems, unverified);
	return { problems, unverified };
}

function checkEnvironmentJobs(workflow: any, environment: string, problems: string[], unverified: string[]): void {
	const jobs: any[] = Object.values(workflow?.jobs ?? {});
	const environments = jobs.map(environmentName).filter((name) => name !== undefined && name !== null);
	const literal = environments.filter((name) => !isExpression(name));
	// A reusable workflow (`uses:`) can set the environment in the file it calls, out of sight here.
	const callsReusable = jobs.some((job: any) => typeof job?.uses === 'string');
	if (literal.includes(environment)) {
		if (!jobs.some((job: any) => environmentName(job) === environment && grantsIdToken(job, workflow))) {
			// The job that deploys may be a reusable workflow that sets the environment and permissions itself.
			if (callsReusable) {
				unverified.push(`that a job in the "${environment}" environment has \`permissions: id-token: write\``);
			} else {
				problems.push(
					`no job in the "${environment}" environment has \`permissions: id-token: write\`, so no run can request a token`
				);
			}
		}
		return;
	}
	if (environments.length === 0 && !callsReusable) {
		// GitHub omits the environment claim for a job with none, so the policy could never match.
		problems.push(`no job sets an environment, so no run's token carries "${environment}"`);
	} else if (literal.length > 0 && literal.length === environments.length && !callsReusable) {
		problems.push(`its jobs use environment ${literal.join(', ')}, not "${environment}"`);
	} else {
		unverified.push(`that a job runs in the "${environment}" environment`);
	}
}

function triggerEvents(triggers: unknown): { names: string[]; config: Record<string, any> } {
	if (typeof triggers === 'string') return { names: [triggers], config: {} };
	if (Array.isArray(triggers)) return { names: triggers.map(String), config: {} };
	if (triggers && typeof triggers === 'object') return { names: Object.keys(triggers), config: triggers };
	return { names: [], config: {} };
}

const HEAD_REPOSITORY = String.raw`github\.event\.pull_request\.head\.repo`;
const BASE_REPOSITORY = String.raw`(?:github\.repository|github\.event\.pull_request\.base\.repo\.full_name)`;
/**
 * A whole `&&` term that admits only same-repository pull requests. Not `head.repo.fork`: it describes the head
 * repository alone, so it is false for a PR from the root of the base's own fork network, and a deleted fork's null
 * head passes `!fork`.
 */
const SAME_REPOSITORY_TERM = new RegExp(
	`^(?:${HEAD_REPOSITORY}\\.full_name\\s*==\\s*${BASE_REPOSITORY}|${BASE_REPOSITORY}\\s*==\\s*${HEAD_REPOSITORY}\\.full_name)$`
);

function withoutEnclosingParentheses(term: string): string {
	let text = term.trim();
	for (;;) {
		if (!text.startsWith('(') || !text.endsWith(')')) return text;
		let depth = 0;
		const inner = text.slice(1, -1);
		for (const character of inner) {
			depth += character === '(' ? 1 : character === ')' ? -1 : 0;
			if (depth < 0) return text;
		}
		text = inner.trim();
	}
}

/** The top-level `&&` terms of an expression; undefined when it has a top-level `||`. */
function conjuncts(expression: string): string[] | undefined {
	const terms: string[] = [];
	let depth = 0;
	let start = 0;
	let quoted = false;
	for (let index = 0; index < expression.length; index++) {
		const character = expression[index];
		if (character === "'") quoted = !quoted;
		if (quoted) continue;
		if (character === '(') depth++;
		else if (character === ')') depth--;
		else if (depth === 0 && expression.startsWith('||', index)) return undefined;
		else if (depth === 0 && expression.startsWith('&&', index)) {
			terms.push(expression.slice(start, index));
			start = index + 2;
			index++;
		}
	}
	terms.push(expression.slice(start));
	return terms.map(withoutEnclosingParentheses);
}

const PULL_REQUEST_HEAD = /head\.sha|head\.ref|head\.repo|head_ref|merge_commit_sha|refs\/pull\//;
const PR_HEAD_SHELL_CHECKOUT =
	/\bgh\s+pr\s+checkout\b|\bgit\b[^\n]*\b(?:checkout|switch|fetch|pull|worktree|clone|reset)\b[^\n]*(?:head\.sha|head\.ref|head_ref|refs\/pull\/|pull\/)/;

/** How a job holding an identity token could end up running the PR's own code, as far as its steps show. */
function checkPullRequestCheckout(name: string, job: any, problems: string[], unsafe: string[]): void {
	if (typeof job?.uses === 'string') {
		unsafe.push(`that the reusable workflow job "${name}" calls never checks out the pull request's head`);
		return;
	}
	for (const step of asList(job?.steps) as any[]) {
		if (typeof step?.uses === 'string' && /^actions\/checkout@/i.test(step.uses.trim())) {
			for (const field of ['ref', 'repository']) {
				const value = step.with?.[field];
				if (value === undefined) continue;
				if (PULL_REQUEST_HEAD.test(String(value))) {
					problems.push(
						`job "${name}" holds an identity token and checks out the pull request's head (${field}: ${value}), so a ` +
							`PR's code would run with the preview identity`
					);
				} else if (isExpression(value)) {
					unsafe.push(`that job "${name}"'s checkout ${field} (${value}) is not the pull request's head`);
				}
			}
		}
		if (typeof step?.run === 'string' && PR_HEAD_SHELL_CHECKOUT.test(step.run)) {
			problems.push(
				`job "${name}" holds an identity token and a step checks out the pull request's head, so a PR's code would ` +
					'run with the preview identity'
			);
		}
	}
}

function jobCondition(job: any): string {
	return typeof job?.if === 'string'
		? job.if
				.replace(/\$\{\{|\}\}/g, ' ')
				.replace(/\s+/g, ' ')
				.trim()
		: '';
}

/**
 * Fork PRs run `pull_request_target` with the base repository's identity, and no token claim names the head repository,
 * so a job's condition is the only gate. Only a whole `&&` term that admits same-repository pull requests counts, or a
 * needed job with one when the condition has no status function: any of them, `success()` included, lets a job run
 * past a needed job being skipped.
 */
function excludesForks(name: string, jobs: Record<string, any>, seen = new Set<string>()): boolean {
	if (seen.has(name)) return false;
	seen.add(name);
	const condition = jobCondition(jobs[name]);
	if (conjuncts(withoutEnclosingParentheses(condition))?.some((term) => SAME_REPOSITORY_TERM.test(term))) return true;
	if (/\b(?:always|failure|cancelled|success)\s*\(/i.test(condition)) return false;
	return asList(jobs[name]?.needs).some((needed) => excludesForks(String(needed), jobs, seen));
}

function checkSameRepositoryCondition(
	name: string,
	jobs: Record<string, any>,
	problems: string[],
	unsafe: string[]
): void {
	if (excludesForks(name, jobs)) return;
	const condition = jobCondition(jobs[name]);
	if (/head\.repo/.test(condition) || asList(jobs[name]?.needs).length > 0) {
		unsafe.push(`that job "${name}" excludes fork pull requests`);
		return;
	}
	problems.push(
		`job "${name}" runs for pull requests from forks: add \`if: github.event.pull_request.head.repo.full_name == ` +
			'github.repository` to it'
	);
}

/**
 * Checks a `pull_request_target` preview workflow against the policies `enable_previews` writes: what can never match
 * them is a problem, and so is what would hand a fork, or a PR's own code, the preview identity.
 */
export function checkPreviewWorkflowFile(
	content: string,
	branch: string,
	environment: string,
	cleanupEnvironment: string
): WorkflowCheck {
	const problems: string[] = [];
	const unverified: string[] = [];
	const unsafe: string[] = [];
	const { workflow, error } = parseWorkflow(content);
	if (error) return { problems: [error], unverified, unsafe };
	const { names, config } = triggerEvents(workflow?.on);
	if (!names.includes('pull_request_target')) {
		problems.push(`it has no pull_request_target trigger, so no run's token carries event_name pull_request_target`);
	} else {
		const filter = config.pull_request_target;
		const branches = asList(filter?.branches);
		if (branches.length > 0 && !branches.includes(branch)) {
			if (branches.some((entry) => isExpression(entry) || /[*?[!+]/.test(String(entry)))) {
				unverified.push(`that ${branches.join(', ')} matches "${branch}"`);
			} else {
				problems.push(`it runs only for pull requests into ${branches.join(', ')}, not "${branch}"`);
			}
		}
		if (asList(filter?.['branches-ignore']).includes(branch)) {
			problems.push(`its branches-ignore filter leaves out pull requests into "${branch}"`);
		}
	}
	checkEnvironmentJobs(workflow, environment, problems, unverified);
	const jobs: Record<string, any> = workflow?.jobs ?? {};
	for (const [name, job] of Object.entries<any>(jobs)) {
		const environmentOfJob = environmentName(job);
		if (environmentOfJob === cleanupEnvironment && !grantsIdToken(job, workflow) && typeof job?.uses !== 'string') {
			problems.push(`job "${name}" runs in "${cleanupEnvironment}" without \`permissions: id-token: write\``);
		}
		if (!grantsIdToken(job, workflow) && typeof job?.uses !== 'string') continue;
		checkPullRequestCheckout(name, job, problems, unsafe);
		checkSameRepositoryCondition(name, jobs, problems, unsafe);
	}
	return { problems, unverified, unsafe };
}
