## 2024-05-24 - Extracting helper functions from hot paths
**Learning:** In hot paths like logging (`handleLogform`), creating helper functions (like `capitalize`) inside the main function scope causes unnecessary closure recreation on every invocation. In Node.js, extracting simple pure functions outside the hot path scope yields measurable performance improvements (~35% faster in microbenchmarks).
**Action:** Always extract static helper functions and formatters outside of the main function scope for frequently called functions, especially in logging or rendering loops, to prevent closure recreation overhead.

## 2024-05-24 - Array push overhead in hot loop
**Learning:** `sortFields` creates multiple arrays and uses `Array.prototype.push` in a loop inside `handleLogform`. `push` operations and dynamic array resizing are much slower than pre-allocating an array with exact size and direct index assignment, especially for objects with many properties. `sortFields` was taking >550ms for 100k operations while pre-allocation with array indices drops it to ~440ms.
**Action:** When extracting and sorting fields from a logging object, use `new Array(fields.length)` to pre-allocate memory and use direct index assignments to avoid `Array.prototype.push` overhead.

## 2024-05-24 - String processing micro-optimizations
**Learning:** In hot paths like logging serialization, `toLocaleUpperCase()` is significantly slower (~10-15x) than `toUpperCase()` due to locale-awareness. Additionally, adding an early return for string primitives before running `String()` or `JSON.stringify()` within try-catch blocks bypasses unnecessary conversion and execution overhead.
**Action:** Prefer `toUpperCase()` over `toLocaleUpperCase()` unless locale-specific formatting is explicitly required. For serialization utilities, fast-path string primitives by checking `typeof value === 'string'` before heavier type coercion or stringification logic.
