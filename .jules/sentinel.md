## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2024-05-18 - Unhandled Promise Rejections in External Transports
**Vulnerability:** Asynchronous external connection methods, like `discordClient.login()`, were invoked without a `.catch()` block. If the API token is invalid or the connection fails, it causes an Unhandled Promise Rejection which crashes modern Node.js processes, creating a Denial of Service (DoS) vulnerability.
**Learning:** Logging frameworks must fail safely. Unhandled exceptions or promise rejections within a transport should emit a warning or error to the parent logger, but must never forcefully exit the host application process.
**Prevention:** Always append a `.catch()` block to asynchronous initialization, connection, and transmission methods in external transports to catch and route errors to the logger's error emission path instead of throwing globally.
