## 2024-05-24 - Extracting helper functions from hot paths
**Learning:** In hot paths like logging (`handleLogform`), creating helper functions (like `capitalize`) inside the main function scope causes unnecessary closure recreation on every invocation. In Node.js, extracting simple pure functions outside the hot path scope yields measurable performance improvements (~35% faster in microbenchmarks).
**Action:** Always extract static helper functions and formatters outside of the main function scope for frequently called functions, especially in logging or rendering loops, to prevent closure recreation overhead.

## 2024-05-24 - Array push overhead in hot loop
**Learning:** `sortFields` creates multiple arrays and uses `Array.prototype.push` in a loop inside `handleLogform`. `push` operations and dynamic array resizing are much slower than pre-allocating an array with exact size and direct index assignment, especially for objects with many properties. `sortFields` was taking >550ms for 100k operations while pre-allocation with array indices drops it to ~440ms.
**Action:** When extracting and sorting fields from a logging object, use `new Array(fields.length)` to pre-allocate memory and use direct index assignments to avoid `Array.prototype.push` overhead.

## 2024-05-24 - V8 holey array performance vs pre-allocation
**Learning:** While pre-allocating an array using `new Array(size)` and assigning elements by index is conventionally faster, in modern V8 this creates a "holey" (sparse) array until all elements are assigned. Holey arrays disable certain V8 optimizations and can result in slower iteration/operation in hot loops. A microbenchmark showed that a dense array built with `[]` and `Array.prototype.push()` was ~20% faster than the pre-allocated index-assignment approach for processing log fields.
**Action:** When building arrays in hot loops where the exact length is known but elements are conditionally inserted, prefer dense arrays constructed via `.push()` rather than pre-allocating with `new Array(size)` to avoid the "holey" array performance penalty in V8.
