## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-14 - Denial of Logging via Unhandled Promise Rejection on Login
**Vulnerability:** The application calls `this.discordClient.login(discordToken)` without appending a `.catch()` block. If the token is invalid or a network error occurs during initialization, an unhandled promise rejection is thrown. In modern Node.js environments, unhandled promise rejections cause the process to crash, leading to a Denial of Service (DoS) and Denial of Logging.
**Learning:** External asynchronous API operations, especially those initializing connections or clients (like `discordClient.login()`), must have their promise chains properly handled. Logging libraries must fail safely and not bring down the host application.
**Prevention:** Always append a `.catch()` block to asynchronous client operations to catch initialization errors. Ensure that these errors are gracefully handled or emitted via standard event emitters (e.g., `this.emit("warn", error)`).
