## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.
## 2025-02-12 - Log Injection / Unrestricted Mentions via Discord API
**Vulnerability:** Discord allows pinging users (`@everyone`, `@here`, `@user`) when sending messages. By default, sending a message with text containing these tags will trigger a mention. The logger was sending raw log text as the `content` property of the Discord message, which meant that an attacker who could control the contents of a log message (e.g. via username, input fields, error messages) could cause the Discord bot to mass-ping users or roles.
**Learning:** External notification sinks like Discord that parse message text for special actions (like mentions) need to be explicitly told to disable this parsing when used as a logging sink to prevent abuse and alert fatigue.
**Prevention:** When sending messages to the Discord API via discord.js, explicitly set `allowedMentions: { parse: [] }` in the message options.
