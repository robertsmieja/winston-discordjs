## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Denial of Logging via Primitive `in` Operator
**Vulnerability:** The `isTransformableInfo` type guard used the `in` operator to check for properties (e.g., `"level" in info`) without explicitly verifying that the `info` object was actually an object. Passing primitives like a `string`, `number`, or `boolean` caused the `in` operator to throw a runtime `TypeError`, crashing the Node.js process.
**Learning:** Type guards that accept `unknown` or `any` input cannot blindly use the `in` operator. Because unhandled exceptions in asynchronous logging paths can crash the application, an attacker could supply a primitive string that leads to a "Denial of Logging" DoS scenario.
**Prevention:** Always verify that a variable is a non-null object (`typeof info === 'object' && info !== null`) before using the `in` operator in type guards or validation logic.
