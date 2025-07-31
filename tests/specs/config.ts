import fs from 'fs/promises';
import path from 'path';
import { testSuite, expect } from 'manten';
import { createFixture } from '../utils.js';

const { aicommits } = await createFixture();

export default testSuite(({ describe }) => {
	describe('config', async ({ test }) => {
		const openAiToken = 'OPENAI_API_KEY=sk-abc';

		test('set config', async () => {
			await aicommits(['config', 'set', openAiToken]);

			const { stdout } = await aicommits(['config', 'get', 'locale']);
			expect(stdout).toBe('locale=en');
		});

		test('set invalid OPENAI_API_KEY', async () => {
			const { stderr } = await aicommits(
				['config', 'set', 'OPENAI_API_KEY=abc'],
				{
					reject: false,
				}
			);

			expect(stderr).toMatch(
				'Invalid config property OPENAI_API_KEY: Must start with "sk-"'
			);
		});

		test('get config', async () => {
			await aicommits(['config', 'set', openAiToken]);

			const { stdout } = await aicommits(['config', 'get', 'locale']);
			expect(stdout).toBe('locale=en');
		});

		test('get config by env variable', async () => {
			const { stdout } = await aicommits(['config', 'get', 'OPENAI_API_KEY']);
			expect(stdout).toBe('');
		});

		test('set config by env variable', async () => {
			const { stdout } = await aicommits(['config', 'get', 'locale'], {
				env: {
					locale: 'ja',
				},
			});
			expect(stdout).toBe('locale=ja');
		});

		test('get config by env variable precedence over config file', async () => {
			await aicommits(['config', 'set', 'locale=en']);

			const { stdout } = await aicommits(['config', 'get', 'locale'], {
				env: {
					locale: 'ja',
				},
			});
			expect(stdout).toBe('locale=ja');
		});

		test('get config by flag', async () => {
			await aicommits(['config', 'set', 'locale=en']);

			const { stdout } = await aicommits(['config', 'get', 'locale'], {
				env: {
					locale: 'ja',
				},
			});
			expect(stdout).toBe('locale=ja');
		});

		test('get multiple configs', async () => {
			await aicommits(['config', 'set', openAiToken, 'locale=ja']);

			const { stdout } = await aicommits([
				'config',
				'get',
				'locale',
				'generate',
			]);
			expect(stdout).toBe('locale=ja\ngenerate=1');
		});

		test('get config with suppressed errors', async () => {
			const { stdout } = await aicommits(['config', 'get', 'OPENAI_API_KEY']);
			expect(stdout).toBe('');
		});
	});
});
