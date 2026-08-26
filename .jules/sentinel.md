## 2024-05-18 - Denial of Logging via Discord Embed Limits
**Vulnerability:** Discord API rejects messages with embed field names >256 chars, values >1024 chars, or >25 fields. The Winston transport failed to enforce these limits, meaning maliciously large logs (e.g., from an attacker) would be rejected by Discord and never recorded, hiding traces of the attack.
**Learning:** Logging integrations that rely on external APIs with strict length/size limits must enforce those limits locally (e.g., via truncation) to prevent "Denial of Logging" attacks where an attacker intentionally generates oversized logs to bypass monitoring.
**Prevention:** Always sanitize and truncate log fields before sending them to external APIs with known constraints (like Discord, Slack, etc.).

## 2025-02-19 - Denial of Logging via Discord Message Content Limit
**Vulnerability:** The Discord API restricts message `content` to a strict 2000-character limit. Any `send()` call exceeding this will be rejected and the logger catches but swallows this with a `warn` event. Attackers could intentionally flood logs (e.g. huge payloads, deep stack traces) to suppress critical log streams or cause denial of service to observability.
**Learning:** External limits must be defensively checked. Additionally, when implementing limits to a polymorphic function argument in TypeScript, blindly assuming an element is a string before calling `.substring()` introduces unhandled `TypeError` regressions that can crash the entire transport stream entirely.
**Prevention:** Defensively enforce character length limits using `substring(0, MAX_LENGTH)` and enforce typing checks like `typeof input === 'string'` before truncating, to prevent type coercion crashes during edge-case payloads.
