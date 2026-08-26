## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-04-27 - [Log Injection & Unrestricted Mentions in Discord Transports]
**Vulnerability:** The application was passing plain string messages to `this.discordChannel.send()` inside the logging transport module. This allowed any un-sanitized log input (e.g. usernames or debug values containing `@everyone` or `@here`) to silently "ping" and notify all users in the attached Discord channel.
**Learning:** In logging integrations like Discord transports, we often forget that the output destination renders and executes markdown or special mention tags natively. What is simply text in a standard file logger becomes an executable command in chat APIs.
**Prevention:** Always enforce strict boundaries at the transport layer for chat APIs. For `discord.js`, universally pass `{ content: logMessage, allowedMentions: { parse: [] } }` to completely disable server-wide, role, or user pings for all log output unless specifically and deliberately authorized.
