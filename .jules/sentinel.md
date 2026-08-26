## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Denial of Service via Unhandled Promise Rejection in discord.js
**Vulnerability:** The Discord transport failed to add a `.catch()` block to the asynchronous `discordClient.login()` operation. In modern Node.js environments, an unhandled promise rejection (e.g. from an invalid token or network error during login) will crash the entire host process, creating a Denial of Service (DoS) vulnerability.
**Learning:** In Node.js applications, always append `.catch()` blocks to asynchronous external operations. Logging frameworks must fail safely and not bring down the application they are supposed to monitor.
**Prevention:** Always handle promises returned by external APIs (like `discord.js`) using `.catch()` or `try-catch` with `await` to ensure errors are gracefully handled and emitted to the transport's error handlers instead of crashing the process.
