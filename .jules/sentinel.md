## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2024-06-27 - Log Injection via Unrestricted Mentions
**Vulnerability:** Discord allows pinging roles (e.g., @everyone) or users. When logs containing user-provided input are sent directly to Discord channels via the transport layer, attackers could perform a log injection attack by inserting mention payloads into their input. The logging framework would dutifully output these mentions, inadvertently pinging large groups of people.
**Learning:** External services like Discord treat text messages differently than traditional log files by parsing and executing rich features (like mentions). All raw log output sent to such services must explicitly disable these parsing features at the transport boundary to prevent unintentional pings.
**Prevention:** Universally enforce `allowedMentions: { parse: [] }` in all `discordChannel.send()` payloads, refactoring simple string inputs into explicit message objects.
