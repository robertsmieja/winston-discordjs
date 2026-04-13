## 2024-05-24 - Extracting helper functions from hot paths
**Learning:** In hot paths like logging (`handleLogform`), creating helper functions (like `capitalize`) inside the main function scope causes unnecessary closure recreation on every invocation. In Node.js, extracting simple pure functions outside the hot path scope yields measurable performance improvements (~35% faster in microbenchmarks).
**Action:** Always extract static helper functions and formatters outside of the main function scope for frequently called functions, especially in logging or rendering loops, to prevent closure recreation overhead.

## 2024-05-24 - Array push overhead in hot loop
**Learning:** `sortFields` creates multiple arrays and uses `Array.prototype.push` in a loop inside `handleLogform`. `push` operations and dynamic array resizing are much slower than pre-allocating an array with exact size and direct index assignment, especially for objects with many properties. `sortFields` was taking >550ms for 100k operations while pre-allocation with array indices drops it to ~440ms.
**Action:** When extracting and sorting fields from a logging object, use `new Array(fields.length)` to pre-allocate memory and use direct index assignments to avoid `Array.prototype.push` overhead.

## 2024-05-24 - toLocaleUpperCase vs toUpperCase
**Learning:** Using `toLocaleUpperCase()` incurs an internal ICU locale data lookup penalty. For internal casing logic not meant for end-user translation (e.g., standardizing string keys or log levels), `toUpperCase()` bypasses this lookup and is roughly 90% faster.
**Action:** Default to `toUpperCase()` unless locale-specific processing (like the Turkish 'i') is explicitly required by the business logic.

## 2024-05-24 - Fast-path String coercion in safeStringify
**Learning:** A standard `try...catch` block around `String(value)` adds overhead when the value is already a string primitive. By short-circuiting with `typeof value === 'string'`, we bypass the try block and any internal V8 coercion, resulting in a ~50% execution speedup for string properties.
**Action:** In high-volume serialization or formatting loops, add fast-path type checks for primitives before attempting complex cast operations or fallback logic.
