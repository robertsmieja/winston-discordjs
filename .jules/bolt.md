## 2024-05-24 - Extracting helper functions from hot paths
**Learning:** In hot paths like logging (`handleLogform`), creating helper functions (like `capitalize`) inside the main function scope causes unnecessary closure recreation on every invocation. In Node.js, extracting simple pure functions outside the hot path scope yields measurable performance improvements (~35% faster in microbenchmarks).
**Action:** Always extract static helper functions and formatters outside of the main function scope for frequently called functions, especially in logging or rendering loops, to prevent closure recreation overhead.

## 2024-05-24 - Array push overhead in hot loop
**Learning:** `sortFields` creates multiple arrays and uses `Array.prototype.push` in a loop inside `handleLogform`. `push` operations and dynamic array resizing are much slower than pre-allocating an array with exact size and direct index assignment, especially for objects with many properties. `sortFields` was taking >550ms for 100k operations while pre-allocation with array indices drops it to ~440ms.
**Action:** When extracting and sorting fields from a logging object, use `new Array(fields.length)` to pre-allocate memory and use direct index assignments to avoid `Array.prototype.push` overhead.

## 2024-05-24 - toLocaleUpperCase vs toUpperCase performance
**Learning:** `toLocaleUpperCase()` has significant performance overhead (~10x+ slower) compared to `toUpperCase()` in Node.js/V8 due to locale-awareness. In hot paths like logging serialization (`capitalize` for field names), this causes unnecessary CPU overhead.
**Action:** Always prefer `toUpperCase()` or `toLowerCase()` in hot paths (like string formatting or logging) to gain a significant performance improvement (~90%+ reduction in processing time), unless locale-specific conversions are explicitly required by the business logic.

## 2024-05-24 - Early returns in hot serialization functions
**Learning:** When safe-casting unknown types (like in `safeStringify`), calling `String(value)` unconditionally incurs overhead even for values that are already strings. Benchmarking showed an ~20% improvement by just returning early.
**Action:** For performance micro-optimizations in hot logging or serialization paths, add an early return for string primitives (e.g., `if (typeof value === 'string') return value;`) before executing `String()` or `JSON.stringify()` in a try-catch block to bypass unnecessary conversion overhead.
