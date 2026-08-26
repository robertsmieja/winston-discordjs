## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-06-01 - [High] Prevent Log Injection via Unrestricted Mentions
**Vulnerability:** The logger was passing raw string variables (log messages, error strings) directly to `discordChannel.send()`. Since Discord's message content parsing defaults to resolving mentions (like `@everyone` or `@here`), malicious or crafted user input within log data could trigger unrestricted server mentions, resulting in a Denial of Service (DoS) by abuse or social engineering vector via logging mechanisms.
**Learning:** Even internal logging mechanisms can become security risks if the logging sink natively supports rich formatting and parsing of input. What is safe as standard out becomes dangerous when piped into an active communication platform.
**Prevention:** For any raw text content sent via the Discord Transport, enforce the `allowedMentions: { parse: [] }` property in the message payload. This prevents the Discord client from treating any user input as an actionable mention, nullifying log injection risks without breaking standard formatting constraints.
