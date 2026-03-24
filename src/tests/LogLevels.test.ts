import { describe, it, expect } from "vitest"
import { LogLevelToColor } from "../LogLevels"

describe("LogLevels", () => {
  describe("LogLevelToColor", () => {
    it("converts levels to colors successfully", () => {
      expect(LogLevelToColor["info"]).toBe("BLUE")
      expect(LogLevelToColor["warning"]).toBe("YELLOW")
      expect(LogLevelToColor["error"]).toBe("RED")
    })
  })
})
