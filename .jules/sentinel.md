## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Fix Denial of Logging via Custom toString
**Vulnerability:** The application was vulnerable to Denial of Service (Denial of Logging) due to improper checking and execution of `.toString()` on log messages. Specifically, it checked `info.toString !== Object.toString` rather than `Object.prototype.toString`, causing standard objects to fall into a branch that executed `.toString()` without a `try...catch` block. Objects with maliciously crafted `toString()` functions could throw unhandled exceptions and crash the Node.js process.
**Learning:** Comparing against `Object.toString` only checks if the object's `toString` is the `Object` constructor's `toString` method, not the instance `toString` inherited from `Object.prototype`. Furthermore, executing untrusted `toString()` functions without a `try...catch` block in hot paths is dangerous.
**Prevention:** Always compare custom `.toString` implementations strictly against `Object.prototype.toString` to properly identify overridden methods, and wrap all `.toString()` or `JSON.stringify()` executions in a `try...catch` block.
