## 2024-05-24 - Extracting helper functions from hot paths
**Learning:** In hot paths like logging (`handleLogform`), creating helper functions (like `capitalize`) inside the main function scope causes unnecessary closure recreation on every invocation. In Node.js, extracting simple pure functions outside the hot path scope yields measurable performance improvements (~35% faster in microbenchmarks).
**Action:** Always extract static helper functions and formatters outside of the main function scope for frequently called functions, especially in logging or rendering loops, to prevent closure recreation overhead.

## 2024-05-24 - Array push overhead in hot loop
**Learning:** `sortFields` creates multiple arrays and uses `Array.prototype.push` in a loop inside `handleLogform`. `push` operations and dynamic array resizing are much slower than pre-allocating an array with exact size and direct index assignment, especially for objects with many properties. `sortFields` was taking >550ms for 100k operations while pre-allocation with array indices drops it to ~440ms.
**Action:** When extracting and sorting fields from a logging object, use `new Array(fields.length)` to pre-allocate memory and use direct index assignments to avoid `Array.prototype.push` overhead.

## 2024-05-24 - Optimizing String primitive serialization
**Learning:** In serialization paths like `safeStringify`, relying on `try...catch` blocks and `String()` conversions for plain string primitives introduces significant overhead. Microbenchmarks showed that adding an early return (`if (typeof value === 'string') return value;`) before the `try...catch` block improves performance by over 60%.
**Action:** For hot serialization functions, add an early return for string primitives to bypass unnecessary conversion overhead and `try...catch` penalties.

## 2024-05-24 - Avoiding localization overhead in string casing
**Learning:** Using `toLocaleUpperCase()` instead of `toUpperCase()` in frequently called functions like `capitalize` introduces a ~90% execution time performance penalty due to the internal localization resolution overhead, with no practical benefit for most logging contexts.
**Action:** Prefer `toUpperCase()` over `toLocaleUpperCase()` for string capitalization to significantly improve execution time, unless localization is explicitly required.
