## 2024-05-24 - Extracting helper functions from hot paths
**Learning:** In hot paths like logging (`handleLogform`), creating helper functions (like `capitalize`) inside the main function scope causes unnecessary closure recreation on every invocation. In Node.js, extracting simple pure functions outside the hot path scope yields measurable performance improvements (~35% faster in microbenchmarks).
**Action:** Always extract static helper functions and formatters outside of the main function scope for frequently called functions, especially in logging or rendering loops, to prevent closure recreation overhead.

## 2024-05-24 - Array push overhead in hot loop
**Learning:** `sortFields` creates multiple arrays and uses `Array.prototype.push` in a loop inside `handleLogform`. `push` operations and dynamic array resizing are much slower than pre-allocating an array with exact size and direct index assignment, especially for objects with many properties. `sortFields` was taking >550ms for 100k operations while pre-allocation with array indices drops it to ~440ms.
**Action:** When extracting and sorting fields from a logging object, use `new Array(fields.length)` to pre-allocate memory and use direct index assignments to avoid `Array.prototype.push` overhead.
## 2024-05-24 - Avoiding unnecessary capitalization overhead
**Learning:** `toLocaleUpperCase()` can be significantly slower than `toUpperCase()` (~14x slower in microbenchmarks). When local awareness isn't required for system log fields, `toUpperCase()` provides a measurable performance improvement.
**Action:** Use `toUpperCase()` over `toLocaleUpperCase()` when locale-aware capitalization is unnecessary for simple strings.

## 2024-05-24 - String conversion early return
**Learning:** Using `try...catch` and `String()` on a primitive that is already a string adds unnecessary overhead. By adding an early return checking `if (typeof value === 'string') return value` before `try...catch`, the execution time of `safeStringify` dropped by ~58% for string inputs in microbenchmarks.
**Action:** Always add an early return for matching types before executing unnecessary type casting inside a `try...catch` block.
