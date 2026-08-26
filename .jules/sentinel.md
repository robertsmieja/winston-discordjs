## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Denial of Service via Unhandled Promise Rejection in Discord Client Login
**Vulnerability:** The `DiscordTransport` initialized the `discord.js` client using `this.discordClient.login(discordToken)` without appending a `.catch()` block. If an invalid token or network error caused the promise to reject, it triggered an unhandled promise rejection, which crashes Node.js processes.
**Learning:** Asynchronous initialization of external dependencies that return promises (like API clients or network connections) must always handle rejections gracefully, even if they aren't awaited, to prevent bringing down the entire host application.
**Prevention:** Always append a `.catch()` block to "fire-and-forget" promises like `login()` calls, ensuring errors are routed to the logging framework's `emit("warn", error)` handlers safely.
