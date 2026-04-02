## 2024-05-24 - Extracting helper functions from hot paths
**Learning:** In hot paths like logging (`handleLogform`), creating helper functions (like `capitalize`) inside the main function scope causes unnecessary closure recreation on every invocation. In Node.js, extracting simple pure functions outside the hot path scope yields measurable performance improvements (~35% faster in microbenchmarks).
**Action:** Always extract static helper functions and formatters outside of the main function scope for frequently called functions, especially in logging or rendering loops, to prevent closure recreation overhead.

## 2024-05-24 - Array push overhead in hot loop
**Learning:** `sortFields` creates multiple arrays and uses `Array.prototype.push` in a loop inside `handleLogform`. `push` operations and dynamic array resizing are much slower than pre-allocating an array with exact size and direct index assignment, especially for objects with many properties. `sortFields` was taking >550ms for 100k operations while pre-allocation with array indices drops it to ~440ms.
**Action:** When extracting and sorting fields from a logging object, use `new Array(fields.length)` to pre-allocate memory and use direct index assignments to avoid `Array.prototype.push` overhead.

## 2024-05-24 - String formatting and serialization micro-optimizations
**Learning:** In hot paths, `toLocaleUpperCase()` is significantly slower than `toUpperCase()` (~65ms vs ~19ms for 1M iterations) due to locale-awareness overhead. Additionally, passing string primitives through a `try-catch` block for `String()` conversion incurs unnecessary overhead compared to an early return (`if (typeof value === 'string') return value;`), saving ~50% execution time for common string logs.
**Action:** Prefer `toUpperCase()` over `toLocaleUpperCase()` when locale-aware capitalization is not strictly required. Always add early returns for common primitive types (like strings) in hot serialization paths before falling back to `try-catch` blocks or `String()`/`JSON.stringify()` coercions.
