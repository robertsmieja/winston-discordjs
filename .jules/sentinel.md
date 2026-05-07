## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Unrestricted Mentions via Log Injection
**Vulnerability:** Discord integration allowed log payloads to trigger `@here`, `@everyone`, or user/role mentions if those text strings appeared in the log content. An attacker could exploit this by injecting mention strings into application inputs that are subsequently logged, leading to notification spam and "Ping Abuse."
**Learning:** Sending unsanitized log content directly to chat platforms like Discord can lead to unintended side-effects beyond just displaying text, specifically unwanted notifications.
**Prevention:** Always restrict parsing of mentions in chat platform integrations. For Discord, explicitly set `allowedMentions: { parse: [] }` in the message payload to ensure all content is treated as raw text and prevents triggering actual mentions.
