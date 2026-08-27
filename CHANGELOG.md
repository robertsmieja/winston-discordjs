# Changelog

All notable changes to this project are documented in this file.

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

<!--
Release notes for the next tag will be prepared from this section.
SemVer: this release contains breaking changes, so the next release is a
MAJOR bump (v5.0.0).
-->
