# Repository Guidelines for AI Agents

## Scope

These instructions apply to the entire repository. Follow maintainer and user instructions first, then use this file for repository-wide conventions. Keep changes focused on the requested behavior and do not modify unrelated files.

## Project Overview

`winston-discordjs` is a TypeScript Winston transport that sends logs through Discord.js.

- Runtime: Node.js 20 or newer
- Package manager: npm; `package-lock.json` is authoritative
- Public entry point: `src/index.ts`
- Discord compatibility: preserve the declared Discord.js v13 peer dependency unless a task explicitly changes the supported major version
- Build output: CommonJS JavaScript and TypeScript declarations in `dist/`

## Repository Layout

- `src/DiscordTransport.ts` — transport construction, Discord client/channel handling, and log delivery
- `src/LogHandlers.ts` — conversion of Winston/logform values into Discord-safe content and embeds
- `src/LogLevels.ts` — Winston level-to-color mapping
- `src/index.ts` — package export
- `src/tests/` — Vitest unit and regression tests, grouped by source module
- `.github/workflows/` — CI and security workflows
- `package.json` / `package-lock.json` — scripts and reproducible dependency graph
- `vitest.config.ts` — test environment and enforced coverage thresholds

Do not edit generated or local-only paths such as `node_modules/`, `dist/`, or `coverage/` unless a task explicitly requires generated artifacts.

## Setup and Commands

Install exactly from the lockfile:

```sh
npm ci
```

Use the repository scripts rather than ad hoc equivalents:

```sh
npm test            # Vitest suite with coverage thresholds
npm run typecheck   # TypeScript validation without emitting files
npm run lint        # ESLint and Prettier rules
npm run build       # JavaScript bundle, declarations, and lint
npm run check       # Lint and typecheck
npm run clean       # Remove dist/
```

For a focused test while iterating:

```sh
npx vitest run src/tests/LogHandlers.test.ts --coverage=false
```

Before handing off a code change, run at minimum:

```sh
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

## Code Conventions

- Keep TypeScript strict-mode compatible.
- Follow `.prettierrc`: LF line endings, two-space indentation, no semicolons, double quotes, and ES5 trailing commas.
- Preserve the existing public API and default export unless the task explicitly calls for a breaking change.
- Keep Discord-bound message content as strings and enforce Discord message/embed limits.
- Treat log values as untrusted. Serialization must tolerate circular objects, throwing getters, custom `toString()`/`toJSON()` methods, and Proxy traps without crashing the host process.
- Keep mention parsing disabled for emitted log messages.
- Handle rejected Discord operations through the transport's warning path; do not leave promises unhandled.
- Do not add real tokens, channel IDs, credentials, or user data to source, tests, fixtures, or logs.

## Testing Guidelines

- Add regression tests for bug fixes and focused behavior tests for new features.
- Keep tests in the existing module-level file under `src/tests/` when one exists. Add a new test file only for a genuinely separate module or test domain, not solely to hold coverage edge cases.
- Test observable behavior rather than implementation details.
- Use Vitest APIs directly and import every helper or type used by a test.
- Keep mocks faithful to Discord.js v13 signatures, especially Promise-returning methods.
- Do not reduce coverage thresholds to make a change pass. Add meaningful tests or correct the implementation.
- Run both `npm test` and `npm run typecheck` after changing tests.

## Dependencies and Lockfiles

- Use npm for dependency changes; do not introduce additional package-manager lockfiles.
- Update `package.json` and `package-lock.json` together.
- Prefer the smallest compatible dependency update and avoid unrelated lockfile churn.
- Verify dependency changes with a clean `npm ci` before committing.
- CI uses `npm ci`; a locally passing `npm install` is not sufficient evidence that the lockfile is valid.

## Git and Pull Requests

- Inspect `git status` before editing and preserve unrelated tracked or untracked work.
- Stage explicit files rather than using broad staging for a focused change.
- Review the complete diff, scan for conflict markers and debug artifacts, and run `git diff --check`.
- Keep commits narrow and explain behavior changes in the commit message.
- Do not commit generated output, credentials, temporary probes, caches, or editor-specific state.
- After pushing, verify that the hosted branch points to the intended commit and that required CI checks pass.
