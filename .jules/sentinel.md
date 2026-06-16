## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-12 - Denial of Logging via Prototype-less Objects
**Vulnerability:** Maliciously crafted prototype-less objects (e.g. `Object.create(null)`) or objects that intentionally throw errors in `.toString()` caused the logging framework to crash the Node process when it attempted to serialize log messages via direct string interpolation.
**Learning:** String interpolation or `.toString()` calls on arbitrary external data should never be trusted, especially in a logging path where "Denial of Logging" attacks can occur by silently triggering unhandled exceptions.
**Prevention:** Implement a robust fallback serialization mechanism (like `safeStringify` combining `String()`, `JSON.stringify()`, and hardcoded defaults inside `try-catch` blocks) before formatting objects for logging transport payloads.

## 2025-02-12 - Denial of Logging via TypeErrors in Type Guards
**Vulnerability:** The logging path contained a type guard `isTransformableInfo` that used the `in` operator on `info` cast to `any` (`"level" in (info as any)`) without explicitly checking if the parameter was an object or not null. This caused a runtime TypeError to crash the process when primitives (like strings or booleans) were passed.
**Learning:** Type guards processing unknown or any variables, particularly in critical paths like logging, must be fully defensive and validate the type of the argument first (e.g., `typeof info === 'object' && info !== null`) before accessing its properties or using operators like `in`.
**Prevention:** Always ensure type guards in logging pipelines defensively check input types to prevent Denial of Service via unhandled runtime exceptions.
