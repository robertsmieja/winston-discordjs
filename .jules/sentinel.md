## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Log Injection via Unrestricted Discord Mentions & DoS via Unhandled Promise Rejections
**Vulnerability:** 1. The Winston Discord integration previously passed log messages directly to `channel.send()` without restricting mentions, enabling log injection attacks where untrusted log content could trigger unwanted `@everyone` or `@role` pings. 2. The `discordClient.login()` method is asynchronous but lacked a `.catch()` block, creating a Denial of Service (DoS) vulnerability where an unhandled promise rejection could crash the Node.js process if authentication failed.
**Learning:** External API integrations must implement defense-in-depth principles: always sanitize or restrict the blast radius of output payloads (like disabling Discord mention parsing by default) and always safely catch asynchronous external operations to ensure graceful degradation.
**Prevention:** 1. Explicitly pass `allowedMentions: { parse: [] }` when sending payloads to Discord, forcing explicit opt-in for pings. 2. Append `.catch()` blocks to all floating promises in asynchronous setup routines to safely redirect errors to an event emitter or log.
