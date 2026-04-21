## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Unrestricted Discord Mentions via Log Injection
**Vulnerability:** Log messages sent to Discord via `discordChannel.send()` were not sanitizing user-provided content. This allowed an attacker to perform unrestricted Discord mentions (e.g., `@everyone`, `@here`) if their input was included in the log message, causing a Denial of Service or unintended spam in the Discord channel.
**Learning:** External APIs like Discord.js will parse message content for mentions by default. When forwarding logs to such APIs, explicit restrictions must be applied to the message payloads to prevent malicious input from abusing mention functionality.
**Prevention:** Always set `allowedMentions: { parse: [] }` in the message options for all log messages and payloads containing embeds to restrict parsing of mentions, ensuring unintended mentions cannot be triggered by user-controlled log data.
