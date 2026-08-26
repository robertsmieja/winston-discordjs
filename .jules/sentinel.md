## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-23 - Denial of Service via Unhandled Exceptions in Logging Initialization and Processing
**Vulnerability:** The logging framework crashed the Node.js process due to two unhandled exceptions:
1. `discordClient.login()` did not have a `.catch()` handler attached, leading to unhandled promise rejections on authentication or network failures.
2. `isTransformableInfo` attempted to use the `in` operator on primitive values without validating `typeof info === 'object' && info !== null` first, throwing runtime `TypeErrors`.
**Learning:** Logging systems must be extremely resilient and fail securely without crashing the host application. External promises must always be caught, and type guards on `unknown` input must strictly validate the underlying data type before property access.
**Prevention:** Always append `.catch()` to asynchronous initializations (like client `.login()`), and strictly enforce defensive programming in type guards by validating primitives, objects, and nullish values.
