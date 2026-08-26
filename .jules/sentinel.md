## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Denial of Service via Unhandled Promise Rejection in External Calls
**Vulnerability:** The application initiated an asynchronous connection using `discordClient.login()` without attaching a `.catch()` block. If the client encountered an error (like an invalid token), it resulted in an unhandled promise rejection, which causes modern Node.js processes to crash entirely.
**Learning:** Any asynchronous operation that connects to an external system must have comprehensive error handling attached directly to the Promise. Relying solely on event listeners (like `.on('error')`) is insufficient for operations that return Promises which can independently reject. In a logging context, this creates a catastrophic "Denial of Service" vulnerability where failing to initialize the logger crashes the host application.
**Prevention:** Always attach `.catch()` blocks to asynchronous external operations like `discordClient.login()`. Unhandled promise rejections must be safely trapped and routed through the internal logging/warning mechanism (`this.emit('warn')`) to ensure the application fails securely and remains stable.
