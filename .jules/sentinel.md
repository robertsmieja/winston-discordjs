## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Unhandled Promise Rejection DoS
**Vulnerability:** Asynchronous external operations like `discordClient.login()` were called without a `.catch()` block. If the operation failed (e.g. invalid token or network error), the unhandled promise rejection crashed the entire Node.js process, causing a Denial of Service (DoS) vulnerability.
**Learning:** Logging frameworks must fail safely. External network dependencies cannot be trusted to always succeed and their failures should never bring down the host application.
**Prevention:** Always append `.catch()` blocks to asynchronous operations in logging frameworks to catch and emit or ignore errors safely.

## 2025-02-12 - Log Injection via Unrestricted Mentions
**Vulnerability:** Log messages sent via the Discord transport were missing the `allowedMentions: { parse: [] }` configuration. This allowed an attacker to inject Discord mentions (e.g. `@everyone`, `<@123>`) into the logs, which would ping users or roles when rendered in the Discord channel.
**Learning:** External logging platforms with rich formatting features (like Discord, Slack) can parse and act on special syntax in the log content, leading to log injection attacks if not properly restricted.
**Prevention:** Always explicitly disable automatic mention parsing (e.g. `allowedMentions: { parse: [] }`) when sending user-controlled or arbitrary data to Discord.
