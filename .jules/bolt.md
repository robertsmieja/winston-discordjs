## 2024-05-24 - Extracting helper functions from hot paths
**Learning:** In hot paths like logging (`handleLogform`), creating helper functions (like `capitalize`) inside the main function scope causes unnecessary closure recreation on every invocation. In Node.js, extracting simple pure functions outside the hot path scope yields measurable performance improvements (~35% faster in microbenchmarks).
**Action:** Always extract static helper functions and formatters outside of the main function scope for frequently called functions, especially in logging or rendering loops, to prevent closure recreation overhead.

## 2024-05-24 - Array push overhead in hot loop
**Learning:** `sortFields` creates multiple arrays and uses `Array.prototype.push` in a loop inside `handleLogform`. `push` operations and dynamic array resizing are much slower than pre-allocating an array with exact size and direct index assignment, especially for objects with many properties. `sortFields` was taking >550ms for 100k operations while pre-allocation with array indices drops it to ~440ms.
**Action:** When extracting and sorting fields from a logging object, use `new Array(fields.length)` to pre-allocate memory and use direct index assignments to avoid `Array.prototype.push` overhead.
## 2024-05-10 - Avoid toLocaleUpperCase() in hot paths
**Learning:** `toLocaleUpperCase()` has significant performance overhead (~10-15x slower) compared to `toUpperCase()` in Node.js/V8 due to locale-awareness. In high-throughput logging paths like string formatting, this creates an unnecessary bottleneck.
**Action:** Always prefer `toUpperCase()` or `toLowerCase()` in hot paths (like string formatting or logging) to gain a ~90% performance improvement, unless locale-specific conversions are explicitly required by the business logic.

## 2024-05-10 - Early return for string primitives before String() coercion
**Learning:** Even simple operations like the `String()` constructor and `try-catch` blocks incur measurable overhead in hot paths. For a function like `safeStringify` that processes every single log payload, skipping this overhead for values that are already strings yields significant performance improvements (~60% faster).
**Action:** Add an early return (`if (typeof value === 'string') return value;`) for primitives in functions that act as catch-alls before attempting type coercion, `String()`, or `JSON.stringify()`.
