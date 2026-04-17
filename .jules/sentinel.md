## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Denial of Logging via Unchecked Primitive Inputs
**Vulnerability:** The `isTransformableInfo` type guard used the `in` operator (e.g., `"level" in info`) without first verifying that `info` is a non-null object. Passing a primitive like `42` or `null` resulted in a runtime `TypeError`, crashing the Node.js process and causing a Denial of Logging.
**Learning:** Type guards or log handlers accepting `unknown` or `any` input must rigorously type-check the input (e.g., `typeof info === 'object' && info !== null`) before attempting to access properties or use the `in` operator.
**Prevention:** Always defensively check type boundaries for primitive vs object before property access.

## 2025-02-12 - Inaccurate Custom toString Detection
**Vulnerability:** The check `info.toString !== Object.toString` inaccurately detected custom `.toString()` implementations because standard JavaScript objects inherit `.toString` from `Object.prototype`, not the `Object` constructor. Thus, `info.toString` almost always failed equality with `Object.toString`, resulting in unsafe string interpolation.
**Learning:** When detecting overridden prototype methods like `toString` or `valueOf`, always compare strictly against the prototype (e.g., `Object.prototype.toString`), not the constructor.
**Prevention:** Use `Object.prototype.toString` to accurately distinguish default object serialization from custom implementations.
