import { describe, it, expect } from "vitest"
import { handleObject } from "../LogHandlers"

describe("LogHandlers Coverage Edge Cases", () => {
  describe("handleObject()", () => {
    it("handles Errors where stack is not a string", () => {
      const errorWithStack = new Error("error message")
      ;(errorWithStack as any).stack = 123
      expect(handleObject(errorWithStack)).toBe(123)
    })

    it("handles objects where toString() does not return a string", () => {
      const result = handleObject({
        toString: function () {
          return 123
        },
      })
      expect(result).toBe(123)
    })

    it("handles objects where JSON.stringify() returns undefined", () => {
      const result = handleObject(function () {
        return
      })
      expect(result).toBeUndefined()
    })
  })
})
