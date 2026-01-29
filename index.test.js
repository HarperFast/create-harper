import { beforeEach, describe, expect, test, vi } from 'vitest';
import { parseArgv } from './lib/steps/parseArgv.js';

// Mock all dependencies of index.js
vi.mock('@clack/prompts');
vi.mock('@vercel/detect-agent', () => ({
	determineAgent: vi.fn().mockResolvedValue({ isAgent: false }),
}));
vi.mock('./lib/steps/parseArgv.js');
vi.mock('./lib/constants/helpMessage.js', () => ({
	helpMessage: 'help message',
}));
vi.mock('./lib/steps/getProjectName.js');
vi.mock('./lib/steps/handleExistingDir.js');
vi.mock('./lib/steps/getPackageName.js');
vi.mock('./lib/steps/getTemplate.js');
vi.mock('./lib/steps/getExamples.js');
vi.mock('./lib/steps/getRunAppImmediately.js');
vi.mock('./lib/steps/getEnvVars.js');
vi.mock('./lib/steps/checkForUpdate.js');
vi.mock('./lib/steps/scaffoldProject.js');
vi.mock('./lib/steps/installAndOptionallyStart.js');

describe('index.js', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	test('shows help message and exits', async () => {
		vi.mocked(parseArgv).mockReturnValue({
			help: true,
		});
		await import('./index.js?help');
		expect(console.log).toHaveBeenCalledWith('help message');
	});

	test('shows version and exits', async () => {
		const { checkForUpdate } = await import('./lib/steps/checkForUpdate.js');
		vi.mocked(checkForUpdate).mockResolvedValue('1.2.3');
		vi.mocked(parseArgv).mockReturnValue({
			version: true,
		});
		await import('./index.js?version');
		expect(console.log).toHaveBeenCalledWith('Current version: 1.2.3');
	});

	test('runs the full init flow', async () => {
		vi.mocked(parseArgv).mockReturnValue({
			targetDir: 'my-dir',
			template: 'vanilla',
			overwrite: true,
			immediate: true,
			interactive: false,
		});
		// @ts-ignore
		import.meta.jest = vi;

		const { getProjectName } = await import('./lib/steps/getProjectName.js');
		const { handleExistingDir } = await import('./lib/steps/handleExistingDir.js');
		const { getPackageName } = await import('./lib/steps/getPackageName.js');
		const { getTemplate } = await import('./lib/steps/getTemplate.js');
		const { getExamples } = await import('./lib/steps/getExamples.js');
		const { getRunAppImmediately } = await import('./lib/steps/getRunAppImmediately.js');
		const { getEnvVars } = await import('./lib/steps/getEnvVars.js');
		const { scaffoldProject } = await import('./lib/steps/scaffoldProject.js');
		const { installAndOptionallyStart } = await import('./lib/steps/installAndOptionallyStart.js');

		vi.mocked(getProjectName).mockResolvedValue({ projectName: 'my-project', targetDir: 'my-dir', cancelled: false });
		vi.mocked(handleExistingDir).mockResolvedValue({ cancelled: false });
		vi.mocked(getPackageName).mockResolvedValue({ packageName: 'my-pkg', cancelled: false });
		vi.mocked(getTemplate).mockResolvedValue({ template: 'vanilla', cancelled: false });
		vi.mocked(getExamples).mockResolvedValue({ excludedFiles: ['ex1'], cancelled: false });
		vi.mocked(getRunAppImmediately).mockResolvedValue({ immediate: true, cancelled: false });
		vi.mocked(getEnvVars).mockResolvedValue({
			envVars: { username: 'u', target: 't', password: 'p' },
			cancelled: false,
		});

		await import('./index.js?full-flow');

		await vi.waitFor(() => {
			expect(installAndOptionallyStart).toHaveBeenCalled();
		});

		expect(scaffoldProject).toHaveBeenCalledWith(expect.stringContaining('my-dir'), 'my-project', 'my-pkg', 'vanilla', {
			username: 'u',
			target: 't',
			password: 'p',
		}, ['ex1']);
		expect(installAndOptionallyStart).toHaveBeenCalledWith(
			expect.stringContaining('my-dir'),
			expect.any(String),
			true,
			undefined,
		);
	});

	test('shows agent message if in agent environment and interactive', async () => {
		const { determineAgent } = await import('@vercel/detect-agent');
		vi.mocked(determineAgent).mockResolvedValue({ isAgent: true, agent: 'test-agent' });
		vi.mocked(parseArgv).mockReturnValue({
			targetDir: 'my-dir',
			interactive: true,
		});
		await import('./index.js?agent-interactive');
		await vi.waitFor(() => {
			expect(console.log).toHaveBeenCalledWith(expect.stringContaining('To create in one go, run:'));
		});
	});

	test('logs error if init fails', async () => {
		const { getProjectName } = await import('./lib/steps/getProjectName.js');
		vi.mocked(getProjectName).mockRejectedValue(new Error('init failed'));
		vi.mocked(parseArgv).mockReturnValue({});
		await import('./index.js?init-fail');
		await vi.waitFor(() => {
			expect(console.error).toHaveBeenCalled();
		});
		expect(console.error).toHaveBeenCalledWith(expect.any(Error));
	});

	test('cancels if project name selection is cancelled', async () => {
		const { getProjectName } = await import('./lib/steps/getProjectName.js');
		vi.mocked(getProjectName).mockResolvedValue({ cancelled: true });
		vi.mocked(parseArgv).mockReturnValue({});
		const prompts = await import('@clack/prompts');

		await import('./index.js?cancel-project-name');
		await vi.waitFor(() => {
			expect(prompts.cancel).toHaveBeenCalled();
		});
	});

	test('cancels if handle existing dir is cancelled', async () => {
		const { getProjectName } = await import('./lib/steps/getProjectName.js');
		const { handleExistingDir } = await import('./lib/steps/handleExistingDir.js');
		vi.mocked(getProjectName).mockResolvedValue({ projectName: 'p', targetDir: 'd', cancelled: false });
		vi.mocked(handleExistingDir).mockResolvedValue({ cancelled: true });
		vi.mocked(parseArgv).mockReturnValue({});
		const prompts = await import('@clack/prompts');

		await import('./index.js?cancel-existing-dir');
		await vi.waitFor(() => {
			expect(prompts.cancel).toHaveBeenCalled();
		});
	});

	test('cancels if package name selection is cancelled', async () => {
		const { getProjectName } = await import('./lib/steps/getProjectName.js');
		const { handleExistingDir } = await import('./lib/steps/handleExistingDir.js');
		const { getPackageName } = await import('./lib/steps/getPackageName.js');
		vi.mocked(getProjectName).mockResolvedValue({ projectName: 'p', targetDir: 'd', cancelled: false });
		vi.mocked(handleExistingDir).mockResolvedValue({ cancelled: false });
		vi.mocked(getPackageName).mockResolvedValue({ cancelled: true });
		vi.mocked(parseArgv).mockReturnValue({});
		const prompts = await import('@clack/prompts');

		await import('./index.js?cancel-package-name');
		await vi.waitFor(() => {
			expect(prompts.cancel).toHaveBeenCalled();
		});
	});

	test('cancels if template selection is cancelled', async () => {
		const { getProjectName } = await import('./lib/steps/getProjectName.js');
		const { handleExistingDir } = await import('./lib/steps/handleExistingDir.js');
		const { getPackageName } = await import('./lib/steps/getPackageName.js');
		const { getTemplate } = await import('./lib/steps/getTemplate.js');
		vi.mocked(getProjectName).mockResolvedValue({ projectName: 'p', targetDir: 'd', cancelled: false });
		vi.mocked(handleExistingDir).mockResolvedValue({ cancelled: false });
		vi.mocked(getPackageName).mockResolvedValue({ packageName: 'p', cancelled: false });
		vi.mocked(getTemplate).mockResolvedValue({ cancelled: true });
		vi.mocked(parseArgv).mockReturnValue({});
		const prompts = await import('@clack/prompts');

		await import('./index.js?cancel-template');
		await vi.waitFor(() => {
			expect(prompts.cancel).toHaveBeenCalled();
		});
	});

	test('cancels if examples selection is cancelled', async () => {
		const { getProjectName } = await import('./lib/steps/getProjectName.js');
		const { getTemplate } = await import('./lib/steps/getTemplate.js');
		const { getExamples } = await import('./lib/steps/getExamples.js');
		vi.mocked(getProjectName).mockResolvedValue({ projectName: 'p', targetDir: 'd', cancelled: false });
		vi.mocked(getTemplate).mockResolvedValue({ template: 't', cancelled: false });
		vi.mocked(getExamples).mockResolvedValue({ cancelled: true });
		vi.mocked(parseArgv).mockReturnValue({});
		const prompts = await import('@clack/prompts');

		await import('./index.js?cancel-examples');
		await vi.waitFor(() => {
			expect(prompts.cancel).toHaveBeenCalled();
		});
	});

	test('cancels if env vars selection is cancelled', async () => {
		const { getProjectName } = await import('./lib/steps/getProjectName.js');
		const { getTemplate } = await import('./lib/steps/getTemplate.js');
		const { getExamples } = await import('./lib/steps/getExamples.js');
		const { getEnvVars } = await import('./lib/steps/getEnvVars.js');
		vi.mocked(getProjectName).mockResolvedValue({ projectName: 'p', targetDir: 'd', cancelled: false });
		vi.mocked(getTemplate).mockResolvedValue({ template: 't', cancelled: false });
		vi.mocked(getExamples).mockResolvedValue({ excludedFiles: [], cancelled: false });
		vi.mocked(getEnvVars).mockResolvedValue({ cancelled: true });
		vi.mocked(parseArgv).mockReturnValue({});
		const prompts = await import('@clack/prompts');

		await import('./index.js?cancel-env-vars');
		await vi.waitFor(() => {
			expect(prompts.cancel).toHaveBeenCalled();
		});
	});

	test('cancels if immediate run prompt is cancelled', async () => {
		const { getProjectName } = await import('./lib/steps/getProjectName.js');
		const { getTemplate } = await import('./lib/steps/getTemplate.js');
		const { getEnvVars } = await import('./lib/steps/getEnvVars.js');
		const { getRunAppImmediately } = await import('./lib/steps/getRunAppImmediately.js');
		vi.mocked(getProjectName).mockResolvedValue({ projectName: 'p', targetDir: 'd', cancelled: false });
		vi.mocked(getTemplate).mockResolvedValue({ template: 't', cancelled: false });
		vi.mocked(getEnvVars).mockResolvedValue({ envVars: {}, cancelled: false });
		vi.mocked(getRunAppImmediately).mockResolvedValue({ cancelled: true });
		vi.mocked(parseArgv).mockReturnValue({});
		const prompts = await import('@clack/prompts');

		await import('./index.js?cancel-immediate');
		await vi.waitFor(() => {
			expect(prompts.cancel).toHaveBeenCalled();
		});
	});

	test('uses npm if pkg manager cannot be detected', async () => {
		vi.mocked(parseArgv).mockReturnValue({
			targetDir: 'my-dir',
			interactive: false,
		});
		// Unset user agent
		const originalAgent = process.env.npm_config_user_agent;
		delete process.env.npm_config_user_agent;

		const { getProjectName } = await import('./lib/steps/getProjectName.js');
		const { handleExistingDir } = await import('./lib/steps/handleExistingDir.js');
		const { getPackageName } = await import('./lib/steps/getPackageName.js');
		const { getTemplate } = await import('./lib/steps/getTemplate.js');
		const { getExamples } = await import('./lib/steps/getExamples.js');
		const { getRunAppImmediately } = await import('./lib/steps/getRunAppImmediately.js');
		const { getEnvVars } = await import('./lib/steps/getEnvVars.js');

		vi.mocked(getProjectName).mockResolvedValue({ projectName: 'my-project', targetDir: 'my-dir', cancelled: false });
		vi.mocked(handleExistingDir).mockResolvedValue({ cancelled: false });
		vi.mocked(getPackageName).mockResolvedValue({ packageName: 'my-pkg', cancelled: false });
		vi.mocked(getTemplate).mockResolvedValue({ template: 'vanilla', cancelled: false });
		vi.mocked(getExamples).mockResolvedValue({ excludedFiles: [], cancelled: false });
		vi.mocked(getRunAppImmediately).mockResolvedValue({ immediate: true, cancelled: false });
		vi.mocked(getEnvVars).mockResolvedValue({ envVars: {}, cancelled: false });

		const { installAndOptionallyStart } = await import('./lib/steps/installAndOptionallyStart.js');

		await import('./index.js?no-pkg-manager');

		await vi.waitFor(() => {
			expect(installAndOptionallyStart).toHaveBeenCalledWith(
				expect.any(String),
				'npm', // Defaulted to npm
				expect.any(Boolean),
				undefined,
			);
		});
		process.env.npm_config_user_agent = originalAgent;
	});

	test('passes skipInstall to installAndOptionallyStart', async () => {
		vi.mocked(parseArgv).mockReturnValue({
			targetDir: 'my-dir',
			skipInstall: true,
		});
		const { getProjectName } = await import('./lib/steps/getProjectName.js');
		const { handleExistingDir } = await import('./lib/steps/handleExistingDir.js');
		const { getPackageName } = await import('./lib/steps/getPackageName.js');
		const { getTemplate } = await import('./lib/steps/getTemplate.js');
		const { getExamples } = await import('./lib/steps/getExamples.js');
		const { getRunAppImmediately } = await import('./lib/steps/getRunAppImmediately.js');
		const { getEnvVars } = await import('./lib/steps/getEnvVars.js');

		vi.mocked(getProjectName).mockResolvedValue({ projectName: 'my-project', targetDir: 'my-dir', cancelled: false });
		vi.mocked(handleExistingDir).mockResolvedValue({ cancelled: false });
		vi.mocked(getPackageName).mockResolvedValue({ packageName: 'my-pkg', cancelled: false });
		vi.mocked(getTemplate).mockResolvedValue({ template: 'vanilla', cancelled: false });
		vi.mocked(getExamples).mockResolvedValue({ excludedFiles: [], cancelled: false });
		vi.mocked(getRunAppImmediately).mockResolvedValue({ immediate: true, cancelled: false });
		vi.mocked(getEnvVars).mockResolvedValue({ envVars: {}, cancelled: false });

		const { installAndOptionallyStart } = await import('./lib/steps/installAndOptionallyStart.js');

		await import('./index.js?skip-install-test');

		await vi.waitFor(() => {
			expect(installAndOptionallyStart).toHaveBeenCalled();
		});

		expect(installAndOptionallyStart).toHaveBeenCalledWith(
			expect.stringContaining('my-dir'),
			expect.any(String),
			expect.any(Boolean),
			true,
		);
	});
});
