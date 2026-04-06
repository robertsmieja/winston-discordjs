## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Denial of Logging via Unhandled Exceptions in \`in\` operator and \`toString()\`
**Vulnerability:** The \`in\` operator crashes when used on primitive values (like strings or numbers) in JavaScript. If \`isTransformableInfo\` is passed a primitive and blindly tries \`"level" in info\`, the Node process crashes. Additionally, explicitly relying on \`info.toString()\` when it differs from \`Object.toString\` can lead to crashes if a malicious object explicitly overrides \`toString\` to throw an error.
**Learning:** Type guards and logging serialization functions must be excessively defensive. Never use the \`in\` operator on untyped data without first verifying \`typeof info === "object" && info !== null\`. Furthermore, when invoking custom \`toString()\` methods on untrusted objects, always compare against \`Object.prototype.toString\` (not \`Object.toString\`) and wrap the invocation in a \`try...catch\` block to prevent Denial of Service (DoS) crashes that lead to Denial of Logging.
**Prevention:** Strict type checking before object property access on \`unknown\` types and \`try-catch\` wrappers around custom serialization method invocations.
