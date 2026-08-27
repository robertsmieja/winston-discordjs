# Changelog

All notable changes to this project are documented in this file.

Historical entries below were reconstructed from the git tag history and
commit history; release dates are the tag creation dates.

## [Unreleased] - consolidated review batch (#1216)

This release accumulates 152 individually reviewed bot improvement PRs
(Sentinel security, Bolt performance, Palette accessibility) folded into a
single integration branch. Headline behavior changes:

### Breaking changes

- **Discord mentions are no longer parsed in emitted log messages.**
  Every outgoing Discord message now sends `allowedMentions: { parse: [] }`.
  Log content containing `@everyone`, `@here`, role, or user mention
  syntax renders as plain text and no longer triggers pings. Previously
  Discord's default mention parsing applied, so crafted log strings could
  ping users. If you need a deliberate mention (for example to alert
  moderators), send it through purpose-built content, not the transport.

- **Log message length is restored to the documented 2000-character cap**
  (Discord message limit). An earlier optimization had removed the cap;
  long messages are now truncated at 2000 characters again.

### Non-breaking changes

- Hardened log serialization: `isTransformableInfo()` and related helpers
  now return `false` for primitives instead of throwing a `TypeError`
  when the `in` operator is used on a non-object, and never trust
  throwing `toString()` / custom accessors on untrusted log data.
- Safe stringification fallback chains for objects that throw while
  serializing (`safeStringify`), with a fast path for plain strings.
- Kept the JSON fallback when `String(value)` yields an unusable value.
- Contribution guidelines (AGENTS.md) now codify treating log values as
  untrusted and keeping mention parsing disabled.

## [4.0.1] - 2026-03-22

- Fixed the `repository` URL in `package.json` to point to
  `robertsmieja/winston-discordjs`.
- Routine dependency maintenance updates (dependabot).

## [4.0.0] - 2022-07-12

### Breaking / structural

- Discord.js is now a **peer dependency** (`^13.8.1`) instead of a
  direct dependency. Consumers must install `discord.js` themselves.
- Runtime floor raised to **Node >= 16.6** (npm >= 8).

### Maintenance

- Modernized runtime dependencies around the Winston transport and logform
  stacks (`winston-transport`, `logform`, `utility-types`, `@types/ws`).
- Large volume of routine dev-dependency and toolchain updates across
  TypeScript, ESLint, Babel, Jest, and `@types` packages.
- Unit test fixes accompanying the dependency refresh.

## [3.0.0] - 2021-09-03

### Breaking

- Upgraded to **Discord.js 13** (`^13.1.0`) and **Node 16** (runtime
  floor raised from Node >= 14). Adjust for Discord.js 13 API changes
  (embeds, message options) when integrating.

### Maintenance

- Extensive routine dependency updates across the toolchain (dependabot),
  including security-flagged bumps (for example `path-parse`, `glob-parent`).

## [2.1.1] - 2020-08-20

- Dependency maintenance updates.

## [2.1.0] - 2020-05-19

- Code reformatted for Prettier 2 defaults.
- Dependency maintenance updates.

## [2.0.2] - 2020-03-13

- Security fix: bump `acorn` from 6.4.0 to 6.4.1.
- Dependency maintenance updates.

## [2.0.1] - 2020-03-07

- Removed an unsupported Node version from CI to fix the build.
- Documentation updates.

## [2.0.0] - 2020-03-07

### Breaking

- Upgraded to **Discord.js 12** (`^12.0.1`) together with **TypeScript
  3.8**, **Node 12** runtime floor, Jest, and Babel toolchain.
  Compatible with Discord.js v12 message and channel APIs.

## [1.1.0] - 2020-01-14

- Serialization now prefers JSON (`JSON.stringify`) over the default
  `toString()` when formatting objects into messages.
- Recreated the package lock to fix build issues; devDependency refresh.

## [1.0.0] - 2019-11-24

- First stable release.
- Added NPM badge to the README.

## Pre-1.0 history

- **[0.2.5] - 2019-11-23** Added Codecov badge to README; added a
  Codecov step to GitHub Actions.
- **[0.2.4] - 2019-11-23** Added badges to README.
- **[0.2.3] - 2019-11-22** Transport returns the formatted string when
  using RichEmbed; dependency updates.
- **[0.2.2] - 2019-11-22** Embedded a JSON version of the message when
  using RichEmbed, improving mobile client readability.
- **[0.2.1] - 2019-11-22** Removed the `@types/triple-beam` dependency.
- **[0.2.0] - 2019-11-22** Added RichEmbed output selected by log level;
  adopted nullish coalescing; removed an unneeded dependency; devDependency
  security fixes.
- **[0.1.0] - 2019-11-17** Added log handlers for various scenarios,
  robustness improvements, MIT license, documentation, VSCode build and
  debug tasks, Jest config and coverage thresholds.
- **[0.0.3] - 2019-11-16** Switched output to CommonJS modules; fixed
  the `types` field in `package.json`.
- **[0.0.2] - 2019-11-16** Initial technical groundwork.
- **[0.0.1] - 2019-11-15** Initial commit.
