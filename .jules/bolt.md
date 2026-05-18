## 2024-05-24 - Extracting helper functions from hot paths
**Learning:** In hot paths like logging (`handleLogform`), creating helper functions (like `capitalize`) inside the main function scope causes unnecessary closure recreation on every invocation. In Node.js, extracting simple pure functions outside the hot path scope yields measurable performance improvements (~35% faster in microbenchmarks).
**Action:** Always extract static helper functions and formatters outside of the main function scope for frequently called functions, especially in logging or rendering loops, to prevent closure recreation overhead.

## 2024-05-24 - Array push overhead in hot loop
**Learning:** `sortFields` creates multiple arrays and uses `Array.prototype.push` in a loop inside `handleLogform`. `push` operations and dynamic array resizing are much slower than pre-allocating an array with exact size and direct index assignment, especially for objects with many properties. `sortFields` was taking >550ms for 100k operations while pre-allocation with array indices drops it to ~440ms.
**Action:** When extracting and sorting fields from a logging object, use `new Array(fields.length)` to pre-allocate memory and use direct index assignments to avoid `Array.prototype.push` overhead.

## 2024-05-24 - toLocaleUpperCase vs toUpperCase overhead
**Learning:** `toLocaleUpperCase()` has significant performance overhead (~3-4x slower in microbenchmarks) compared to `toUpperCase()` in Node.js/V8 due to locale-awareness. In hot paths like logging serialization (`capitalize`), this overhead is noticeable.
**Action:** Always prefer `toUpperCase()` or `toLowerCase()` in hot paths unless locale-specific conversions are explicitly required by the business logic.

## 2024-05-24 - Array.push vs manual pre-allocation in modern V8
**Learning:** In modern V8, manually pre-allocating an array (`new Array(size)`) and maintaining a manual index (`result[idx++] = val`) can sometimes be slower than simply using `Array.prototype.push()` on an initially empty array. In `sortFields`, `push()` was ~3x faster than the manual index management approach. This may be because dynamic array growth is highly optimized, whereas pre-allocating creates 'holey' arrays if not immediately filled sequentially, or the manual tracking overhead outweighs the allocation savings for small arrays.
**Action:** Default to `Array.prototype.push()` for building arrays in loops rather than manual index tracking, unless dealing with extremely large, perfectly sequential numeric arrays.
