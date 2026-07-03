## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2024-05-20 - Log Injection via Unrestricted Discord Mentions
**Vulnerability:** The Discord transport sent log messages directly as strings without setting `allowedMentions`. This allowed any log message containing `@everyone`, `@here`, or role pings to actually trigger notifications in the Discord server, enabling log injection attacks where an attacker could spam server members simply by causing logs with mention tags.
**Learning:** External communication APIs (like Discord, Slack) often parse raw text for mentions or commands. All programmatic messages sent to these platforms, especially system logs that may include unverified string data, must explicitly disable mention parsing at the transport boundary to prevent abuse.
**Prevention:** Always explicitly set restrictions like `allowedMentions: { parse: [] }` in the API payload to sanitize outgoing log messages and prevent accidental or malicious mention triggering.
