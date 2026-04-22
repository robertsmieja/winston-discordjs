## 2024-05-24 - Extracting helper functions from hot paths
**Learning:** In hot paths like logging (`handleLogform`), creating helper functions (like `capitalize`) inside the main function scope causes unnecessary closure recreation on every invocation. In Node.js, extracting simple pure functions outside the hot path scope yields measurable performance improvements (~35% faster in microbenchmarks).
**Action:** Always extract static helper functions and formatters outside of the main function scope for frequently called functions, especially in logging or rendering loops, to prevent closure recreation overhead.

## 2024-05-24 - Array push overhead in hot loop
**Learning:** `sortFields` creates multiple arrays and uses `Array.prototype.push` in a loop inside `handleLogform`. `push` operations and dynamic array resizing are much slower than pre-allocating an array with exact size and direct index assignment, especially for objects with many properties. `sortFields` was taking >550ms for 100k operations while pre-allocation with array indices drops it to ~440ms.
**Action:** When extracting and sorting fields from a logging object, use `new Array(fields.length)` to pre-allocate memory and use direct index assignments to avoid `Array.prototype.push` overhead.

## 2024-05-24 - String Primitive Checking in Serialization
**Learning:** In highly trafficked logging serialization paths (like `safeStringify`), executing `String()` directly on primitive strings wrapped in a `try-catch` block has measurable conversion and scope setup overhead in some V8 contexts. Benchmarking showed an early return (`if (typeof value === 'string') return value;`) bypasses this overhead entirely, yielding a ~50% execution time improvement on 10M iterations.
**Action:** Always add an early return for string primitives before wrapping conversions in `try-catch` blocks for hot serialization loops to maximize throughput.

## 2024-05-24 - toUpperCase vs toLocaleUpperCase Overhead
**Learning:** For simple string capitalization (like internal log levels), `toLocaleUpperCase()` triggers the JS engine to check system localization rules, which carries immense overhead compared to the simple ASCII mapping of `toUpperCase()`. Benchmarking showed `toUpperCase` is over 90% faster.
**Action:** Use `toUpperCase()` instead of `toLocaleUpperCase()` for all internal, non-user-facing string standardizations to avoid unnecessary engine localization checks.
