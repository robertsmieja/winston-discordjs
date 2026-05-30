## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Log Injection via Discord Mentions
**Vulnerability:** The transport previously sent raw string content directly to Discord. Because Discord natively parses text mentions like `@everyone` or `<@userid>`, an attacker who could control logged content (like usernames or input strings) could create "Log Injection" attacks. The logs would trigger real notifications and ping arbitrary roles or users, which is a major security and annoyance risk.
**Learning:** Whenever you forward text to a system that supports parseable mentions or macros (like Discord or Slack), you must explicitly disable the parsing of those features to ensure the message is treated strictly as plain text.
**Prevention:** Always use `allowedMentions: { parse: [] }` (or the equivalent payload) when sending data from untrusted contexts to Discord APIs.
