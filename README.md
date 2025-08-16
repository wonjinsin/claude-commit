## Attribution

## Notice

This repository is a modified version of [Nutlope/aicommits](https://github.com/Nutlope/aicommits).  
Original source is licensed under the MIT License.  
All credits go to the original authors.  
Changes have been made to suit internal requirements. Please refer to the LICENSE file for original license terms.

## Setup

> The minimum supported version of Node.js is the latest v14. Check your Node.js version with `node --version`.

1. Install _aicommits_:

   ```sh
   git clone https://github.com/wonjinsin/claude-commit
   sudo npm install
   npm run build
   sudo npm link
   ```

2. Retrieve your API key from [Anthropic](https://platform.openai.com/account/api-keys) or [Anthropic](https://console.anthropic.com/)

   > Note: If you haven't already, you'll have to create an account and set up billing.

3. Set the key so aicommits can use it:

   **For OpenAI:**

   ```sh
   aicommits config set MODEL=openai
   aicommits config set OPENAI_API_KEY=<your token>
   ```

   **For Claude:**

   ```sh
   aicommits config set MODEL=claude
   aicommits config set CLAUDE_API_KEY=<your token>
   ```

   This will create a `.aicommits` file in your home directory.

   > **Note:** You must explicitly set MODEL to either `openai` or `claude` to specify which AI provider to use.

## Usage

### CLI mode

You can call `aicommits` directly to generate a commit message for your staged changes:

```sh
git add <files...>
aicommits
```

`aicommits` passes down unknown flags to `git commit`, so you can pass in [`commit` flags](https://git-scm.com/docs/git-commit).

For example, you can stage all changes in tracked files with as you commit:

```sh
aicommits --all # or -a
```

> 👉 **Tip:** Use the `aic` alias if `aicommits` is too long for you.

> If you ever want to write your own message instead of generating one, you can simply pass one in: `git commit -m "My message"`

#### Generate multiple recommendations

Sometimes the recommended commit message isn't the best so you want it to generate a few to pick from. You can generate multiple commit messages at once by passing in the `--generate <i>` flag, where 'i' is the number of generated messages:

```sh
aicommits --generate <i> # or -g <i>
```

This feature can be useful if your project follows the Conventional Commits standard or if you're using tools that rely on this commit format.

**Example outputs:**

- `feat: add user authentication system`
- `fix: resolve login validation issue`
- `docs: update API documentation`
- `refactor: improve code structure`
- `test: add unit tests for auth module`

### Git hook

You can also integrate _aicommits_ with Git via the [`prepare-commit-msg`](https://git-scm.com/docs/githooks#_prepare_commit_msg) hook. This lets you use Git like you normally would, and edit the commit message before committing.

#### Install

In the Git repository you want to install the hook in:

```sh
aicommits hook install
```

#### Uninstall

In the Git repository you want to uninstall the hook from:

```sh
aicommits hook uninstall
```

### Setting a configuration value

To set a configuration option, use the command:

```sh
aicommits config set <key>=<value>
```

For example, to set the API key, you can use:

```sh
aicommits config set OPENAI_API_KEY=<your-api-key>
```

You can also set multiple configuration options at once by separating them with spaces, like

```sh
aicommits config set OPENAI_API_KEY=<your-api-key> generate=3 locale=en
```

### Options

#### MODEL

Required

The AI model provider to use. Must be either `openai` or `claude`.

```sh
aicommits config set MODEL=openai
# or
aicommits config set MODEL=claude
```

#### OPENAI_API_KEY

Required (when MODEL=openai)

The OpenAI API key. You can retrieve it from [OpenAI API Keys page](https://platform.openai.com/account/api-keys).

#### OPENAI_MODEL

Default: `gpt-3.5-turbo`

The OpenAI model to use. Consult the list of models available in the [OpenAI Documentation](https://platform.openai.com/docs/models/model-endpoint-compatibility).

> Tip: If you have access, try upgrading to [`gpt-4`](https://platform.openai.com/docs/models/gpt-4) for next-level code analysis. It can handle double the input size, but comes at a higher cost. Check out OpenAI's website to learn more.

```sh
aicommits config set OPENAI_MODEL=gpt-4
```

#### CLAUDE_API_KEY

Required (when MODEL=claude)

The Claude API key. You can retrieve it from [Anthropic Console](https://console.anthropic.com/).

#### CLAUDE_API_MODEL

Default: `claude-sonnet-4-0`

The Claude model to use. You can use any Claude model available in the Anthropic API.

```sh
aicommits config set CLAUDE_API_MODEL=claude-3-5-sonnet-20241022
```

**Popular models:**

- `claude-sonnet-4-0` - Latest Sonnet model (default)
- `claude-3-5-sonnet-20241022` - Most capable model
- `claude-3-5-haiku-20241022` - Fast and efficient
- `claude-3-opus-20240229` - Most powerful (legacy)
- `claude-3-sonnet-20240229` - Balanced (legacy)
- `claude-3-haiku-20240307` - Fast (legacy)

#### locale

Default: `en`

The locale to use for the generated commit messages. Consult the list of codes in: https://wikipedia.org/wiki/List_of_ISO_639-1_codes.

#### generate

Default: `1`

The number of commit messages to generate to pick from.

Note, this will use more tokens as it generates more results.

#### proxy

Set a HTTP/HTTPS proxy to use for requests.

To clear the proxy option, you can use the command (note the empty value after the equals sign):

```sh
aicommits config set proxy=
```

#### timeout

The timeout for network requests to the OpenAI API in milliseconds.

Default: `10000` (10 seconds)

```sh
aicommits config set timeout=20000 # 20s
```

#### max-length

The maximum character length of the generated commit message.

Default: `150`

```sh
aicommits config set max-length=100
```

## How it works

This CLI tool runs `git diff` to grab all your latest code changes, sends them to the selected AI model (OpenAI or Claude), then returns the AI generated commit message.

Video coming soon where I rebuild it from scratch to show you how to easily build your own CLI tools powered by AI.

## Maintainers

- **Hassan El Mghari**: [@Nutlope](https://github.com/Nutlope) [<img src="https://img.shields.io/twitter/follow/nutlope?style=flat&label=nutlope&logo=twitter&color=0bf&logoColor=fff" align="center">](https://twitter.com/nutlope)

- **Hiroki Osame**: [@privatenumber](https://github.com/privatenumber) [<img src="https://img.shields.io/twitter/follow/privatenumbr?style=flat&label=privatenumbr&logo=twitter&color=0bf&logoColor=fff" align="center">](https://twitter.com/privatenumbr)

## Contributing

If you want to help fix a bug or implement a feature in [Issues](https://github.com/Nutlope/aicommits/issues), checkout the [Contribution Guide](CONTRIBUTING.md) to learn how to setup and test the project
