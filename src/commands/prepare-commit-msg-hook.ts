import fs from 'fs/promises';
import { intro, outro, spinner } from '@clack/prompts';
import { black, green, red, bgCyan } from 'kolorist';
import { getStagedDiff } from '../utils/git.js';
import { getConfig } from '../utils/config.js';
import { generateCommitMessage } from '../utils/openai.js';
import { generateCommitMessageWithClaude } from '../utils/claude.js';
import { KnownError, handleCliError } from '../utils/error.js';

const [messageFilePath, commitSource] = process.argv.slice(2);

export default () =>
	(async () => {
		if (!messageFilePath) {
			throw new KnownError(
				'Commit message file path is missing. This file should be called from the "prepare-commit-msg" git hook'
			);
		}

		// If a commit message is passed in, ignore
		if (commitSource) {
			return;
		}

		// All staged files can be ignored by our filter
		const staged = await getStagedDiff();
		if (!staged) {
			return;
		}

		intro(bgCyan(black(' aicommits ')));

		const { env } = process;
		const config = await getConfig({
			MODEL: env.MODEL,
			OPENAI_API_KEY: env.OPENAI_API_KEY,
			OPENAI_MODEL: env.OPENAI_MODEL,
			CLAUDE_API_KEY: env.CLAUDE_API_KEY,
			CLAUDE_API_MODEL: env.CLAUDE_API_MODEL,
			proxy:
				env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY,
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
					staged!.diff,
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
					staged!.diff,
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

		/**
		 * When `--no-edit` is passed in, the base commit message is empty,
		 * and even when you use pass in comments via #, they are ignored.
		 *
		 * Note: `--no-edit` cannot be detected in argvs so this is the only way to check
		 */
		const baseMessage = await fs.readFile(messageFilePath, 'utf8');
		const supportsComments = baseMessage !== '';
		const hasMultipleMessages = messages.length > 1;

		let instructions = '';

		if (supportsComments) {
			instructions = `# 🤖 AI generated commit${
				hasMultipleMessages ? 's' : ''
			}\n`;
		}

		if (hasMultipleMessages) {
			if (supportsComments) {
				instructions +=
					'# Select one of the following messages by uncommeting:\n';
			}
			instructions += `\n${messages
				.map((message) => `# ${message}`)
				.join('\n')}`;
		} else {
			if (supportsComments) {
				instructions += '# Edit the message below and commit:\n';
			}
			instructions += `\n${messages[0]}\n`;
		}

		await fs.appendFile(messageFilePath, instructions);
		outro(`${green('✔')} Saved commit message!`);
	})().catch((error) => {
		outro(`${red('✖')} ${error.message}`);
		handleCliError(error);
		process.exit(1);
	});
