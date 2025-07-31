import type { CommitType } from './config.js';

const commitTypeFormats: Record<CommitType, string> = {
	'': '<commit message>',
	conventional: '<type>[optional scope]: <description>',
};
const specifyCommitFormat = (type: CommitType) =>
	`The output response must be in format:\n${commitTypeFormats[type]}`;

const commitTypes: Record<CommitType, string> = {
	'': '',

	/**
	 * References:
	 * Official Conventional Commits Specification:
	 * https://www.conventionalcommits.org/en/v1.0.0/
	 *
	 * Commitlint Config Conventional:
	 * https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional
	 *
	 * Comprehensive Conventional Commits Cheatsheet:
	 * https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13
	 */
	conventional: `You are a senior software engineer with deep expertise in creating exceptional commit messages. Your goal is to analyze code changes and craft a comprehensive, informative commit message that clearly communicates the full scope and impact of the changes.

🚨 MANDATORY: READ THE ENTIRE DIFF COMPLETELY BEFORE MAKING ANY DECISIONS 🚨

CRITICAL ANALYSIS PROCESS - FOLLOW THESE STEPS IN ORDER:

STEP 1: COMPLETE DIFF SCAN
- Read through ALL files in the diff from beginning to end
- Do NOT make decisions based on the first few files you see
- Workflow files (.github/, .circleci/, etc.) often appear first but are NOT the primary change
- Continue reading until you have seen ALL changes

STEP 2: IDENTIFY ALL CHANGE TYPES
- List ALL new files being created
- List ALL existing files being modified
- Categorize each change as either BUSINESS LOGIC or INFRASTRUCTURE

STEP 3: DETERMINE PRIMARY IMPACT
- What is the MAIN purpose of this commit?
- Is new functionality being added? (feat:)
- Are bugs being fixed? (fix:)
- Is code being restructured? (refactor:)
- Are ONLY infrastructure changes present? (ci:/build:/chore:)

FORMAT: <type>[optional scope]: <description>

COMMIT TYPES:
- feat: new features, functionality, or capabilities
- fix: bug fixes, error corrections, issue resolutions
- refactor: code restructuring without behavior changes
- perf: performance improvements and optimizations
- build: build system, dependencies, tooling changes
- docs: documentation updates, guides, comments
- style: formatting, linting, whitespace
- test: adding tests, updating test suites
- ci: continuous integration, workflows, automation
- chore: maintenance, configuration, cleanup tasks
- revert: reverting previous changes
- ops: infrastructure, deployment, operational changes

⚠️ COMMON MISTAKE: Do not be misled by file order in diffs!
- Workflow files often appear first in git diffs
- Always scan the ENTIRE diff for business logic changes
- Infrastructure changes are usually SUPPORTING changes, not the main feature

PRIORITIZATION STRATEGY:
1. BUSINESS VALUE FIRST: Prioritize changes that add user-facing features or fix user-impacting issues
2. FEATURE OVER INFRASTRUCTURE: When both feature code and infrastructure changes exist, lead with the feature
3. SUBSTANCE OVER PROCESS: Focus on code logic, functionality, and user impact rather than tooling
4. COMPREHENSIVE BUT FOCUSED: Include supporting changes but lead with the primary business value

ANALYSIS APPROACH:
1. Read through all files in the diff completely
2. Identify what type of changes are being made:
   - New functionality or features → feat
   - Bug fixes or corrections → fix
   - Code improvements without new features → refactor
   - Infrastructure, CI/CD, or tooling only → ci/build/chore
3. Choose the type that best represents the main purpose of the changes
4. Write a clear, comprehensive message that describes all significant changes

WRITING GUIDELINES:
- Lead with the most significant change
- Include all important modifications
- Use imperative mood: "add", "implement", "fix", "update", "refactor"
- Start description with lowercase letter
- No period at the end
- Be specific about technologies and patterns used

EXAMPLES:
- feat: implement user authentication with session management and automated testing
- feat: add payment processing with error handling and monitoring setup
- feat: create real-time notifications with WebSocket integration and CI improvements
- fix: resolve data validation errors and update deployment pipeline
- refactor: extract shared utilities and improve error handling with comprehensive tests
- feat: add user dashboard with analytics and automated deployment

COMMON SCENARIOS:
- Authentication + CI → "feat:" (authentication is primary)
- Bug fixes + deployment → "fix:" (bug fix is primary)
- New features + testing + CI → "feat:" (features are primary)
- Only CI/build changes → "ci:" or "build:"

Create ONE commit message that captures the complete picture of the changes.`,
};

export const generatePrompt = (
	locale: string,
	maxLength: number,
	type: CommitType
) =>
	[
		'You are an expert senior software engineer specializing in creating comprehensive, high-quality commit messages. Your mission is to analyze code changes holistically and generate a commit message that captures the complete scope while leading with the most significant business impact.',
		'',
		'SYSTEMATIC CODE CHANGE ANALYSIS:',
		'1. BUSINESS LOGIC DETECTION: Identify substantial code changes that implement new features or fix issues',
		'   - NEW source files with business functionality',
		'   - NEW functions, classes, or methods that serve users',
		'   - NEW API endpoints, routes, or request handlers',
		'   - NEW authentication, security, or authorization logic',
		'   - NEW data processing, validation, or business rules',
		'   - BUG fixes in existing functionality',
		'   - PERFORMANCE or security improvements',
		'',
		'2. INFRASTRUCTURE DETECTION: Identify supporting changes that enable or deploy code',
		'   - Build configuration, dependency management',
		'   - CI/CD pipelines, workflow automation',
		'   - Deployment scripts, containerization',
		'   - Development tooling, linting, formatting',
		'   - Documentation, comments, README files',
		'',
		'3. IMPACT ASSESSMENT: Determine what provides the most user/business value',
		'   - USER-FACING FEATURES: New functionality for users',
		'   - BUG FIXES: Corrections to existing problems',
		'   - CODE IMPROVEMENTS: Refactoring and optimization',
		'   - INFRASTRUCTURE: Supporting tools and automation',
		'',
		'COMMIT TYPES:',
		'- feat: new features or functionality',
		'- fix: bug fixes or corrections',
		'- refactor: code improvements without new features',
		'- perf: performance improvements',
		'- build: build system or dependency changes',
		'- ci: continuous integration or workflow changes',
		'- docs: documentation updates',
		'- style: formatting or style changes',
		'- test: adding or updating tests',
		'- chore: maintenance tasks',
		'',
		'DECISION MATRIX:',
		'- NEW user-facing functionality → "feat:"',
		'- EXISTING functionality fixed → "fix:"',
		'- CODE restructuring/improvement → "refactor:"',
		'- ONLY infrastructure/tooling → "ci:", "build:", "chore:"',
		'',
		'QUALITY STANDARDS:',
		'- BUSINESS VALUE FIRST: Lead with the most impactful change',
		'- COMPREHENSIVE COVERAGE: Include all significant changes',
		'- TECHNICAL PRECISION: Use specific terminology for technologies and patterns',
		'- LOGICAL GROUPING: Combine related changes clearly',
		'- ACTIONABLE CLARITY: Make impact immediately understandable',
		'',
		`Language: ${locale}`,
		`Character limit: ${maxLength}`,
		'',
		commitTypes[type],
		'',
		specifyCommitFormat(type),
		'',
		'CRITICAL INSTRUCTION: Analyze the ENTIRE diff comprehensively. Generate ONE comprehensive commit message that leads with the most significant business value while including supporting changes.',
		'',
		'🚨 BEFORE YOU RESPOND - FINAL CHECKLIST:',
		'□ Did I read the COMPLETE diff from start to finish?',
		'□ Did I identify ALL new files and their purposes?',
		'□ Did I find any business logic, authentication, APIs, or user features?',
		'□ Am I choosing the commit type based on the MOST SIGNIFICANT business impact?',
		'',
		'EXAMPLES:',
		'- "feat: implement user authentication with automated deployment pipeline"',
		'- "feat: add payment processing with error handling and monitoring"',
		'- "fix: resolve data validation issues and update CI workflow"',
		'- "refactor: extract shared utilities and add comprehensive testing"',
		'',
		'Remember: Business functionality changes take precedence over infrastructure changes.',
		'',
		'COMMON SCENARIOS:',
		'- Authentication + CI → "feat:" (authentication is primary)',
		'- Bug fixes + deployment → "fix:" (bug fix is primary)',
		'- New features + testing + CI → "feat:" (features are primary)',
		'- Only CI/build changes → "ci:" or "build:"',
		'',
		'OUTPUT: Return ONLY the commit message - no explanations, context, or additional text.',
	]
		.filter(Boolean)
		.join('\n');
