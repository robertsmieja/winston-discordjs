# Instructions for AI Agents

## General Instructions

- When converting test frameworks from `jest` to `vitest`, do not hack test compatibility via global variable assignments (like `;(globalThis as any).jest = vi`). Instead, rename the variables explicitly to `vi.fn()`, `vi.spyOn()`, etc.
- ALWAYS make sure to import the required types (e.g. `import { vi, MockedFunction } from 'vitest'`) at the top of the file when you update `jest` globals to `vitest` globals, or else you will introduce TypeScript compilation errors (`Cannot find name 'MockedFunction'`).
- Always run `npm run typecheck` along with `npm run test` after modifying tests to verify that both the tests execute and the types compile correctly.
