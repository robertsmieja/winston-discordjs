## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-13 - Unrestricted Discord Mentions in Logging Transport
**Vulnerability:** The Discord logging transport was vulnerable to log injection triggering unintended `@everyone`, `@here`, or specific role/user mentions. If an application logged unfiltered user input containing these mention strings, the Discord bot would alert users.
**Learning:** The vulnerability existed because the discord.js `send()` method defaults to parsing mentions within the message content if `allowedMentions` is not explicitly restricted.
**Prevention:** Always restrict mention parsing by default when using discord.js to send logs or user-generated content. Set `allowedMentions: { parse: [] }` in the message payload options to ensure mentions are rendered as plain text without triggering notifications.
