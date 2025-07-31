import { execa } from 'execa';
import { black, dim, green, red, bgCyan } from 'kolorist';
import {
	intro,
	outro,
	spinner,
	select,
	confirm,
	isCancel,
} from '@clack/prompts';
import {
	assertGitRepo,
	getStagedDiff,
	getDetectedMessage,
} from '../utils/git.js';
import { getConfig } from '../utils/config.js';
import { generateCommitMessage } from '../utils/openai.js';
import { generateCommitMessageWithClaude } from '../utils/claude.js';
import { KnownError, handleCliError } from '../utils/error.js';

export default async (
	generate: number | undefined,
	excludeFiles: string[],
	stageAll: boolean,
	commitType: string | undefined,
	rawArgv: string[]
) =>
	(async () => {
		intro(bgCyan(black(' aicommits ')));
		await assertGitRepo();

		const detectingFiles = spinner();

		if (stageAll) {
			// This should be equivalent behavior to `git commit --all`
			await execa('git', ['add', '--update']);
		}

		detectingFiles.start('Detecting staged files');
		const staged = await getStagedDiff(excludeFiles);

		if (!staged) {
			detectingFiles.stop('Detecting staged files');
			throw new KnownError(
				'No staged changes found. Stage your changes manually, or automatically stage all changes with the `--all` flag.'
			);
		}

		detectingFiles.stop(
			`${getDetectedMessage(staged.files)}:\n${staged.files
				.map((file) => `     ${file}`)
				.join('\n')}`
		);

		const { env } = process;
		const config = await getConfig({
			MODEL: env.MODEL,
			OPENAI_API_KEY: env.OPENAI_API_KEY,
			OPENAI_MODEL: env.OPENAI_MODEL,
			CLAUDE_API_KEY: env.CLAUDE_API_KEY,
			CLAUDE_API_MODEL: env.CLAUDE_API_MODEL,
			proxy:
				env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY,
			generate: generate?.toString(),
			type: commitType?.toString(),
		});

		const s = spinner();
		s.start('The AI is analyzing your changes');
		let messages: string[];
		try {
			// Choose AI based on MODEL setting
			if (config.MODEL === 'claude') {
				if (!config.CLAUDE_API_KEY) {
					throw new KnownError(
						'Claude API key is required when MODEL=claude. Please set CLAUDE_API_KEY.'
					);
				}
				messages = await generateCommitMessageWithClaude(
					config.CLAUDE_API_KEY!,
					config.CLAUDE_API_MODEL,
					config.locale,
					staged.diff,
					config.generate,
					config['max-length'],
					config.type,
					config.timeout,
					config.proxy
				);
			} else if (config.MODEL === 'openai') {
				if (!config.OPENAI_API_KEY) {
					throw new KnownError(
						'OpenAI API key is required when MODEL=openai. Please set OPENAI_API_KEY.'
					);
				}
				messages = await generateCommitMessage(
					config.OPENAI_API_KEY!,
					config.OPENAI_MODEL,
					config.locale,
					staged.diff,
					config.generate,
					config['max-length'],
					config.type,
					config.timeout,
					config.proxy
				);
			} else {
				throw new KnownError(`Invalid MODEL setting: ${config.MODEL}`);
			}
		} finally {
			s.stop('Changes analyzed');
		}

		if (messages.length === 0) {
			throw new KnownError('No commit messages were generated. Try again.');
		}

		let message: string;
		if (messages.length === 1) {
			[message] = messages;
			const confirmed = await confirm({
				message: `Use this commit message?\n\n   ${message}\n`,
			});

			if (!confirmed || isCancel(confirmed)) {
				outro('Commit cancelled');
				return;
			}
		} else {
			const selected = await select({
				message: `Pick a commit message to use: ${dim('(Ctrl+c to exit)')}`,
				options: messages.map((value) => ({ label: value, value })),
			});

			if (isCancel(selected)) {
				outro('Commit cancelled');
				return;
			}

			message = selected as string;
		}

		await execa('git', ['commit', '-m', message, ...rawArgv]);

		outro(`${green('✔')} Successfully committed!`);
	})().catch((error) => {
		outro(`${red('✖')} ${error.message}`);
		handleCliError(error);
		process.exit(1);
	});
