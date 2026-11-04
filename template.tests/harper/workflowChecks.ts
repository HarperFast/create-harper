// dprint-ignore-file
// Harper's own checks of the scaffolded workflows, copied verbatim from
// HarperFast/harper@e58d105ee3f630f4a8b616e0ca811545f01c8582 bin/deploySetupGithubActions.ts
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

const PULL_REQUEST_HEAD =
	/head\.sha|head\.ref|head\.repo|head_ref|GITHUB_HEAD_REF|merge_commit_sha|refs\/pull\/|(?<![\w/])pull\/\S/;
// Also matched over a whole step, since `$( )` or a quote can put the verb on a later line than `git`.
const GIT_FETCHING_CODE = /\bgit\b.*\b(?:checkout|switch|fetch|pull|worktree|clone|reset)\b/s;
// Read over the whole step: a multi-line quote, a pipe or xargs carries a value onto a git line that shows none of it.
const DYNAMIC_INPUT = /[$`<|]|\bxargs\b/;
const COMMAND_ASSIGNMENTS =
	/(^|[;&|({]|\b(?:then|do|else|export|local|declare|readonly)\b)(?:\s*\w+=(?:"(?:[^"\\]|\\.)*"|'[^']*'|\$\{\{[^}]*\}\}|[^\s;&|"'])*)+/g;

// Any mention but a read counts: shell has more ways to set a variable than a list of them would hold.
function maySetVariable(script: string, variable: string): boolean {
	return new RegExp(String.raw`(?<!\$\{?[#!]?|env\.)\b${variable}\b`).test(script);
}

/**
 * Only a head the file shows outright counts: in the command itself, or in the `env:` value of a variable that no
 * script able to replace it touches. A shell assignment's scope and order are not read, so its value is unverified.
 */
function namesPullRequestHead(text: string, scopes: any[], earlierScripts: string, ownScript = ''): boolean {
	const command = text.replace(COMMAND_ASSIGNMENTS, '$1');
	if (PULL_REQUEST_HEAD.test(command)) return true;
	return [...command.matchAll(/\benv\.(\w+)|\$\{?(\w+)/g)].some(([, inExpression, inShell]) => {
		const variable = inExpression ?? inShell;
		// `${{ env.X }}` is filled in before the step's shell starts; an earlier step can still write X to GITHUB_ENV.
		if (maySetVariable(inExpression ? earlierScripts : `${earlierScripts}\n${ownScript}`, variable)) return false;
		const value = scopes.map((scope) => scope?.env?.[variable]).find((candidate) => candidate !== undefined);
		return value !== undefined && PULL_REQUEST_HEAD.test(String(value));
	});
}

/**
 * A `git` fetch or checkout in a step that takes any input is unverified rather than resolved: reading shell has no end,
 * and the operator can vouch for it with `allow_unverified=true`.
 */
function checkPullRequestCheckout(name: string, job: any, workflow: any, problems: string[], unsafe: string[]): void {
	if (typeof job?.uses === 'string') {
		unsafe.push(`that the reusable workflow job "${name}" calls never checks out the pull request's head`);
		return;
	}
	const steps = asList(job?.steps) as any[];
	const scripts = steps.map((step) => (typeof step?.run === 'string' ? step.run : ''));
	const headCheckout =
		`job "${name}" holds an identity token and a step checks out the pull request's head, so a PR's code would ` +
		'run with the preview identity';
	for (const [index, step] of steps.entries()) {
		const scopes = [step, job, workflow];
		const earlierScripts = scripts.slice(0, index).join('\n');
		if (typeof step?.uses === 'string' && /^actions\/checkout@/i.test(step.uses.trim())) {
			for (const field of ['ref', 'repository']) {
				const value = step.with?.[field];
				if (value === undefined) continue;
				if (namesPullRequestHead(String(value), scopes, earlierScripts)) {
					problems.push(
						`job "${name}" holds an identity token and checks out the pull request's head (${field}: ${value}), so a ` +
							`PR's code would run with the preview identity`
					);
				} else if (isExpression(value)) {
					unsafe.push(`that job "${name}"'s checkout ${field} (${value}) is not the pull request's head`);
				}
			}
		}
		if (typeof step?.run !== 'string') continue;
		const lines = step.run.replace(/\\\r?\n\s*/g, ' ').split('\n');
		if (lines.some((line: string) => /\bgh\s+pr\s+checkout\b/.test(line))) {
			problems.push(headCheckout);
			continue;
		}
		const gitLines = lines.filter((line: string) => GIT_FETCHING_CODE.test(line));
		if (gitLines.some((line: string) => namesPullRequestHead(line, scopes, earlierScripts, step.run))) {
			problems.push(headCheckout);
		} else if (DYNAMIC_INPUT.test(step.run) && GIT_FETCHING_CODE.test(step.run)) {
			const named = gitLines.length > 0 ? gitLines : lines.filter((line: string) => /\bgit\b/.test(line));
			for (const line of named) {
				unsafe.push(`that \`${line.trim()}\` in job "${name}" does not check out the pull request's head`);
			}
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

const ACTION_IS_CLOSED = /^(?:github\.event\.action\s*==\s*'closed'|'closed'\s*==\s*github\.event\.action)$/i;
const ACTION_IS_NOT_CLOSED = /^(?:github\.event\.action\s*!=\s*'closed'|'closed'\s*!=\s*github\.event\.action)$/i;

/** Undefined when a condition says more than that the job runs for a closed same-repository pull request. */
function runsOnClose(name: string, jobs: Record<string, any>, path = new Set<string>()): boolean | undefined {
	if (path.has(name) || !jobs[name]) return undefined;
	const condition = jobCondition(jobs[name]);
	if (condition) {
		const terms = conjuncts(withoutEnclosingParentheses(condition));
		if (terms?.some((term) => ACTION_IS_NOT_CLOSED.test(term))) return false;
		if (!terms?.every((term) => ACTION_IS_CLOSED.test(term) || SAME_REPOSITORY_TERM.test(term))) return undefined;
	}
	// With no status function in the condition, a needed job that is skipped skips this one.
	let runs: boolean | undefined = true;
	for (const needed of asList(jobs[name]?.needs)) {
		const neededRuns = runsOnClose(String(needed), jobs, new Set(path).add(name));
		if (neededRuns === false) return false;
		if (neededRuns === undefined) runs = undefined;
	}
	return runs;
}

/** A closed PR's preview lasts until it expires unless a job drops it, and `closed` is not a default event type. */
function checkCleanupPath(workflow: any, filter: any, cleanupEnvironment: string, unverified: string[]): void {
	const jobs: Record<string, any> = workflow?.jobs ?? {};
	const cleanupJobs = Object.keys(jobs).filter((name) => environmentName(jobs[name]) === cleanupEnvironment);
	const dropped = "that a closed pull request's preview is dropped before it expires";
	if (cleanupJobs.length === 0) {
		unverified.push(`${dropped}, since no job here runs in "${cleanupEnvironment}"`);
		return;
	}
	if (!asList(filter?.types).includes('closed')) {
		unverified.push(`${dropped}, since its pull_request_target types leave out closed`);
		return;
	}
	const runs = cleanupJobs.map((name) => runsOnClose(name, jobs));
	if (runs.includes(true)) return;
	const named = (names: string[]) => names.map((name) => `job "${name}"`).join(' or ');
	const unknown = cleanupJobs.filter((_, index) => runs[index] === undefined);
	unverified.push(
		unknown.length > 0
			? `that ${named(unknown)} runs when a pull request closes, which is what drops its preview before it expires`
			: `${dropped}, since ${named(cleanupJobs)} does not run when a pull request closes`
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
		checkCleanupPath(workflow, filter, cleanupEnvironment, unverified);
	}
	checkEnvironmentJobs(workflow, environment, problems, unverified);
	const jobs: Record<string, any> = workflow?.jobs ?? {};
	for (const [name, job] of Object.entries<any>(jobs)) {
		const environmentOfJob = environmentName(job);
		if (environmentOfJob === cleanupEnvironment && !grantsIdToken(job, workflow) && typeof job?.uses !== 'string') {
			problems.push(`job "${name}" runs in "${cleanupEnvironment}" without \`permissions: id-token: write\``);
		}
		if (!grantsIdToken(job, workflow) && typeof job?.uses !== 'string') continue;
		checkPullRequestCheckout(name, job, workflow, problems, unsafe);
		checkSameRepositoryCondition(name, jobs, problems, unsafe);
	}
	return { problems, unverified, unsafe };
}
