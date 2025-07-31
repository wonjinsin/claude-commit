import https from 'https';
import type { ClientRequest, IncomingMessage } from 'http';
import createHttpsProxyAgent from 'https-proxy-agent';
import { KnownError } from './error.js';
import type { CommitType } from './config.js';
import { generatePrompt } from './prompt.js';

interface ClaudeMessage {
	role: 'user' | 'assistant';
	content: ClaudeContent[];
}

interface ClaudeContent {
	type: 'text';
	text: string;
}

interface ClaudeRequest {
	model: string;
	messages: ClaudeMessage[];
	max_tokens: number;
	temperature: number;
	top_p: number;
	stream: boolean;
}

interface ClaudeResponse {
	id: string;
	type: string;
	role: string;
	model: string;
	content: ClaudeContent[];
	stop_reason: string;
	stop_sequence: string | null;
	usage: {
		input_tokens: number;
		cache_creation_input_tokens: number;
		cache_read_input_tokens: number;
		output_tokens: number;
		service_tier: string;
	};
}

const httpsPost = async (
	hostname: string,
	path: string,
	headers: Record<string, string>,
	json: unknown,
	timeout: number,
	proxy?: string
) =>
	new Promise<{
		request: ClientRequest;
		response: IncomingMessage;
		data: string;
	}>((resolve, reject) => {
		const postContent = JSON.stringify(json);
		const request = https.request(
			{
				port: 443,
				hostname,
				path,
				method: 'POST',
				headers: {
					...headers,
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(postContent),
				},
				timeout,
				agent: proxy ? (createHttpsProxyAgent(proxy) as any) : undefined,
			},
			(response) => {
				const body: Buffer[] = [];
				response.on('data', (chunk) => body.push(chunk));
				response.on('end', () => {
					resolve({
						request,
						response,
						data: Buffer.concat(body).toString(),
					});
				});
			}
		);
		request.on('error', reject);
		request.on('timeout', () => {
			request.destroy();
			reject(
				new KnownError(
					`Time out error: request took over ${timeout}ms. Try increasing the \`timeout\` config, or checking the Claude API status`
				)
			);
		});

		request.write(postContent);
		request.end();
	});

const createClaudeCompletion = async (
	apiKey: string,
	json: ClaudeRequest,
	timeout: number,
	proxy?: string
) => {
	const { response, data } = await httpsPost(
		'api.anthropic.com',
		'/v1/messages',
		{
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
		},
		json,
		timeout,
		proxy
	);

	if (
		!response.statusCode ||
		response.statusCode < 200 ||
		response.statusCode > 299
	) {
		let errorMessage = `Claude API Error: ${response.statusCode} - ${response.statusMessage}`;

		if (data) {
			errorMessage += `\n\n${data}`;
		}

		throw new KnownError(errorMessage);
	}

	return JSON.parse(data) as ClaudeResponse;
};

const sanitizeMessage = (message: string) => {
	let sanitized = message
		.trim()
		.replace(/[\n\r]/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/^["']|["']$/g, '')
		.replace(/(\w)\.$/, '$1');

	// Remove common AI response prefixes
	sanitized = sanitized.replace(
		/^(commit message:|here's the commit message:|the commit message is:)\s*/i,
		''
	);

	// Ensure it starts with lowercase for conventional commits
	if (
		sanitized.match(
			/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|ops):/
		)
	) {
		return sanitized;
	}

	return sanitized;
};

const deduplicateMessages = (array: string[]) => Array.from(new Set(array));

export const generateCommitMessageWithClaude = async (
	apiKey: string,
	model: string,
	locale: string,
	diff: string,
	completions: number,
	maxLength: number,
	type: CommitType,
	timeout: number,
	proxy?: string
) => {
	try {
		const messages: string[] = [];

		// Claude API generates one response at a time, so call multiple times
		for (let i = 0; i < completions; i++) {
			const completion = await createClaudeCompletion(
				apiKey,
				{
					model,
					messages: [
						{
							role: 'user',
							content: [
								{
									type: 'text',
									text: `${generatePrompt(
										locale,
										maxLength,
										type
									)}\n\nHere are the changes:\n${diff}`,
								},
							],
						},
					],
					max_tokens: 300,
					temperature: 0.05,
					top_p: 0.95,
					stream: false,
				},
				timeout,
				proxy
			);

			if (completion.content && completion.content[0]?.text) {
				messages.push(sanitizeMessage(completion.content[0].text));
			} else {
				console.log(
					'Claude API response:',
					JSON.stringify(completion, null, 2)
				);
			}
		}

		return deduplicateMessages(messages);
	} catch (error) {
		const errorAsAny = error as any;
		if (errorAsAny.code === 'ENOTFOUND') {
			throw new KnownError(
				`Error connecting to ${errorAsAny.hostname} (${errorAsAny.syscall}). Are you connected to the internet?`
			);
		}

		throw errorAsAny;
	}
};
