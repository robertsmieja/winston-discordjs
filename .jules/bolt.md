## 2024-05-24 - Extracting helper functions from hot paths
**Learning:** In hot paths like logging (`handleLogform`), creating helper functions (like `capitalize`) inside the main function scope causes unnecessary closure recreation on every invocation. In Node.js, extracting simple pure functions outside the hot path scope yields measurable performance improvements (~35% faster in microbenchmarks).
**Action:** Always extract static helper functions and formatters outside of the main function scope for frequently called functions, especially in logging or rendering loops, to prevent closure recreation overhead.

## 2024-05-24 - Array push overhead in hot loop
**Learning:** `sortFields` creates multiple arrays and uses `Array.prototype.push` in a loop inside `handleLogform`. `push` operations and dynamic array resizing are much slower than pre-allocating an array with exact size and direct index assignment, especially for objects with many properties. `sortFields` was taking >550ms for 100k operations while pre-allocation with array indices drops it to ~440ms.
**Action:** When extracting and sorting fields from a logging object, use `new Array(fields.length)` to pre-allocate memory and use direct index assignments to avoid `Array.prototype.push` overhead.

## 2024-05-24 - Early return for string primitives
**Learning:** `safeStringify` was executing a string conversion (`String(value)`) inside a `try/catch` block for every logging property. Since many logged values are already strings, returning the value directly via an early return (`if (typeof value === 'string') return value;`) completely bypasses the try/catch overhead and function calls. This yielded a ~50% speedup in benchmarked execution time.
**Action:** Always add early returns for primitive string values before applying `String()` or `JSON.stringify()` conversions within `try/catch` wrappers in hot paths like logging serializers.
