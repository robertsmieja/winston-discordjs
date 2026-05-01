## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Log Injection & Unrestricted Mentions in Discord Transport
**Vulnerability:** The Discord transport was passing raw log strings directly to the Discord API `send()` method without restricting mentions. An attacker could inject `@everyone`, `@here`, or specific user IDs into log messages (log injection), causing unintended mass pings and notification spam.
**Learning:** External transports (like Discord or Slack) that support dynamic mention parsing must always have those features explicitly disabled when sending automated logs. User-supplied data must never be allowed to trigger alert mechanisms natively provided by the platform.
**Prevention:** Always set `allowedMentions: { parse: [] }` (or the platform-equivalent setting) in message payload options to prevent dynamic mentions from being parsed by the transport API.
