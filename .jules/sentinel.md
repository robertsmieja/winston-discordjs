## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-03-31 - Denial of Logging via Unbounded String Primitives
**Vulnerability:** Discord API rejects messages with content exceeding 2000 characters. The Winston transport enforced this limit for object/logform payloads via embeddings but failed to truncate unbounded string primitive logs. Thus, maliciously large primitive logs (e.g., from an attacker) would be rejected by Discord and silently hidden.
**Learning:** External API message content size limits must be comprehensively enforced across all input code paths, not just formatted objects. Silent logging failures on large input strings can hide traces of attacks.
**Prevention:** Always check message bounds limits (e.g. 2000 characters) across all execution paths prior to invoking logging mechanisms dependent on third-party integrations with strict restrictions.
