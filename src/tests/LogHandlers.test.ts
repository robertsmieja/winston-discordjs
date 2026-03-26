import { describe, it, expect } from "vitest"
import {
  isTransformableInfo,
  handlePrimitive,
  handleLogform,
  handleObject,
  handleInfo,
} from "../LogHandlers"
import * as logform from "logform"
import { MessageEmbed } from "discord.js"

describe("LogHandlers", () => {
  const transformableInfo: logform.TransformableInfo = {
    level: "info",
    message: "hello world",
  }
  const expectedTransformableInfoResult = new MessageEmbed({
    color: 3447003,
    fields: [
      {
        name: "Level",
        value: "info",
        inline: true,
      },
      {
        name: "Message",
        value: "hello world",
        inline: true,
      },
    ],
  })

  describe("isTransformableInfo()", () => {
    it("handles undefined", () => {
      expect(isTransformableInfo(undefined)).toBe(false)
    })

    it("handles null", () => {
      expect(isTransformableInfo(null)).toBe(false)
    })

    it("handles NaN", () => {
      expect(isTransformableInfo(NaN)).toBe(false)
    })

    it("handles 0", () => {
      expect(isTransformableInfo(0)).toBe(false)
    })

    it("handles false", () => {
      expect(isTransformableInfo(false)).toBe(false)
    })

    it(`handles ""`, () => {
      expect(isTransformableInfo("")).toBe(false)
    })

    it("handles an empty object", () => {
      expect(isTransformableInfo({})).toBe(false)
    })

    it("handles partial matches", () => {
      expect(isTransformableInfo({ level: "info" })).toBe(false)
      expect(isTransformableInfo({ message: "hello world" })).toBe(false)
    })

    it("handles exact matches", () => {
      expect(
        isTransformableInfo({ level: "info", message: "hello world" })
      ).toBe(true)
    })

    it("handles matches with additional data", () => {
      expect(
        isTransformableInfo({
          level: "info",
          message: "hello world",
          format: () => {
            return
          },
          metadata: {},
        })
      ).toBe(true)
    })
  })

  describe("handlePrimitive()", () => {
    it("handles string", () => {
      expect(handlePrimitive("hello world")).toBe("hello world")
    })

    it("handles boolean", () => {
      expect(handlePrimitive(false)).toBe("false")
    })

    it("handles number", () => {
      expect(handlePrimitive(42)).toBe("42")
    })
  })

  describe("handleLogform()", () => {
    it("handles only TransformableInfo", () => {
      expect(handleLogform(transformableInfo, "info")).toStrictEqual([
        "Level: info, Message: hello world",
        expectedTransformableInfoResult,
      ])
    })

    it("safely handles objects without a valid toString or that throw", () => {
      const objWithoutToString: any = Object.create(null)
      objWithoutToString.prop = "value"

      const objThrowingToString = {
        toString: () => {
          throw new Error("toString error")
        },
      }

      const info: logform.TransformableInfo = {
        level: "info",
        message: "hello",
        obj1: objWithoutToString,
        obj2: objThrowingToString,
      }

      const expectedEmbed = new MessageEmbed({
        color: 3447003,
        fields: [
          { name: "Level", value: "info", inline: true },
          { name: "Message", value: "hello", inline: true },
          { name: "Obj1", value: `{"prop":"value"}`, inline: true },
          { name: "Obj2", value: `{}`, inline: true },
        ],
      })

      expect(handleLogform(info, "info")).toStrictEqual([
        `Level: info, Message: hello, Obj1: {"prop":"value"}, Obj2: {}`,
        expectedEmbed,
      ])
    })

    it("handles only TransformableInfo with additional data", () => {
      const expectedValue = new MessageEmbed({
        color: 3447003,
        fields: [
          {
            name: "Level",
            value: "info",
            inline: true,
          },
          {
            name: "Message",
            value: "hello world",
            inline: true,
          },
          { name: "Metadata", value: `{"data":""}`, inline: true },
          { name: "Stack", value: "some stack", inline: true },
        ],
      })

      expect(
        handleLogform(
          {
            ...transformableInfo,
            metadata: { data: "" },
            stack: "some stack",
            empty: "",
          },
          "info"
        )
      ).toStrictEqual([
        `Level: info, Message: hello world, Metadata: {"data":""}, Stack: some stack`,
        expectedValue,
      ])
    })

    it("handles TransformableInfo preserving the original order of other fields", () => {
      const expectedValue = new MessageEmbed({
        color: 3447003,
        fields: [
          {
            name: "Level",
            value: "info",
            inline: true,
          },
          {
            name: "Message",
            value: "hello world",
            inline: true,
          },
          { name: "Alpha", value: "first", inline: true },
          { name: "Zeta", value: "last", inline: true },
          { name: "Beta", value: "middle", inline: true },
        ],
      })

      expect(
        handleLogform(
          {
            level: "info",
            message: "hello world",
            alpha: "first",
            zeta: "last",
            beta: "middle",
          },
          "info"
        )
      ).toStrictEqual([
        "Level: info, Message: hello world, Alpha: first, Zeta: last, Beta: middle",
        expectedValue,
      ])
    })

    it("handles TransformableInfo preserving the expected priority field order", () => {
      const expectedValue = new MessageEmbed({
        color: 3447003,
        fields: [
          { name: "Timestamp", value: "test time", inline: true },
          { name: "Level", value: "info", inline: true },
          { name: "Message", value: "hello world", inline: true },
          { name: "Other", value: "other data", inline: true },
        ],
      })

      expect(
        handleLogform(
          {
            other: "other data",
            message: "hello world",
            timestamp: "test time",
            level: "info",
          },
          "info"
        )
      ).toStrictEqual([
        "Timestamp: test time, Level: info, Message: hello world, Other: other data",
        expectedValue,
      ])
    })

    it("handles TransformableInfo with 'timestamp' field", () => {
      const timestamp = "2023-01-01T00:00:00.000Z"
      const expectedValue = new MessageEmbed({
        color: 3447003,
        fields: [
          {
            name: "Timestamp",
            value: timestamp,
            inline: true,
          },
          {
            name: "Level",
            value: "info",
            inline: true,
          },
          {
            name: "Message",
            value: "hello world",
            inline: true,
          },
        ],
      })

      expect(
        handleLogform(
          {
            ...transformableInfo,
            timestamp,
          },
          "info"
        )
      ).toStrictEqual([
        `Timestamp: ${timestamp}, Level: info, Message: hello world`,
        expectedValue,
      ])
    })

    it("handles TransformableInfo with undefined level", () => {
      const expectedValue = new MessageEmbed({
        color: 0,
        fields: [
          {
            name: "Level",
            value: "info",
            inline: true,
          },
          {
            name: "Message",
            value: "hello world",
            inline: true,
          },
        ],
      })

      expect(handleLogform(transformableInfo, undefined)).toStrictEqual([
        "Level: info, Message: hello world",
        expectedValue,
      ])
    })

    it("handles TransformableInfo with level mismatch", () => {
      expect(handleLogform(transformableInfo, "error")).toBeUndefined()
    })

    it("handles TransformableInfo with level match", () => {
      expect(handleLogform(transformableInfo, "info")).toStrictEqual([
        "Level: info, Message: hello world",
        expectedTransformableInfoResult,
      ])
    })

    it("truncates fields and limits to 25 fields for Discord limits", () => {
      const longName = "A".repeat(300)
      const longValue = "B".repeat(2000)

      const info: logform.TransformableInfo = {
        level: "info",
        message: "hello",
      }

      // Add 30 additional fields (32 total fields with level and message)
      for (let i = 0; i < 30; i++) {
        info[`${longName}${i}`] = longValue
      }

      const result = handleLogform(info, "info")
      expect(result).toBeDefined()

      const resultTuple = result as [string, MessageEmbed]
      const [messageContent, embed] = resultTuple

      // Total message content should be capped at 2000 chars
      expect(messageContent.length).toBeLessThanOrEqual(2000)

      // Embed fields might be less than 25 because of the 6000 aggregate limit.
      // 300 name + 2000 value (truncated to 256 + 1024 = 1280 per field)
      // 6000 / 1280 ~ 4 fields + message + level
      expect(embed.fields.length).toBeLessThanOrEqual(25)

      // Every field name should be <= 256
      // Every field value should be <= 1024
      for (const field of embed.fields) {
        expect(field.name.length).toBeLessThanOrEqual(256)
        expect(field.value.length).toBeLessThanOrEqual(1024)
      }
    })

    it("enforces the 6000 total character limit for embeds", () => {
      const longName = "A".repeat(250)
      const longValue = "B".repeat(1000)

      const info: logform.TransformableInfo = {
        level: "info",
        message: "hello",
      }

      // Add 10 fields, which would be 12500 chars total, way above 6000
      for (let i = 0; i < 10; i++) {
        info[`${longName}${i}`] = longValue
      }

      const result = handleLogform(info, "info")
      expect(result).toBeDefined()

      const resultTuple = result as [string, MessageEmbed]
      const [, embed] = resultTuple

      let totalLength = 0
      for (const field of embed.fields) {
        totalLength += field.name.length + field.value.length
      }

      // Total length should be strictly <= 6000
      expect(totalLength).toBeLessThanOrEqual(6000)
    })
  })

  describe("handleObject()", () => {
    it("handles TransformableInfo", () => {
      expect(handleObject(transformableInfo, undefined, "info")).toStrictEqual([
        "Level: info, Message: hello world",
        expectedTransformableInfoResult,
      ])
    })

    it("handles TransformableInfo with format", () => {
      const expectedMessageEmbed = new MessageEmbed({
        color: 0,
        fields: [
          // { name: "Timestamp", value: expect.anything(), inline: true },
          {
            name: "Level",
            value: "info",
            inline: true,
          },
          {
            name: "Message",
            value: "hello world",
            inline: true,
          },
        ],
      })

      const expectedValue = [
        expect.stringContaining("hello world"),
        expectedMessageEmbed,
      ]

      expect(
        handleObject(
          transformableInfo,
          logform.format.combine(
            logform.format.json(),
            logform.format.simple()
            // format.timestamp()
          ),
          undefined
        )
      ).toEqual(expectedValue)
    })

    it("handles Errors without stack", () => {
      const errorWithoutStack = new Error("error message")
      errorWithoutStack.stack = undefined
      expect(handleObject(errorWithoutStack)).toBe(errorWithoutStack.toString())
    })

    it("handles Errors with stack", () => {
      const errorWithStack = new Error("error message")
      errorWithStack.stack = "some stack"
      expect(handleObject(errorWithStack)).toBe(errorWithStack.stack)
    })

    it("handles objects with a toString() function", () => {
      expect(
        handleObject({
          toString: function () {
            return "Hello World!"
          },
        })
      ).toBe("Hello World!")
    })

    it("handles objects with a toJSON() function", () => {
      expect(
        handleObject({
          toString: undefined,
          toJSON: function () {
            return { hello: "world" }
          },
        })
      ).toBe(`{"hello":"world"}`)
    })

    it("handles objects with a toString() and a toJSON() function", () => {
      expect(
        handleObject({
          toString: function () {
            return "Hello World!"
          },
          toJSON: function () {
            return JSON.stringify({ hello: "world" })
          },
        })
      ).toBe("Hello World!")
    })

    it("handles objects with a toString property that is a function", () => {
      expect(handleObject({ toString: () => "hello world" })).toBe(
        "hello world"
      )
    })

    it("handles objects with a toString property that is not a function", () => {
      const testObject = { toString: "hello world" }
      expect(handleObject(testObject)).toBe(JSON.stringify(testObject))
    })

    it("handles circular objects without throwing", () => {
      const testObject: any = Object.create(null)
      testObject.myself = testObject
      expect(handleObject(testObject)).toBe("[object Object]")
    })
  })

  describe("handleInfo()", () => {
    it("handles function that returns strings", () => {
      expect(handleInfo(() => "hello world")).toBe("hello world")
    })

    it("handles functions that returns boolean", () => {
      expect(handleInfo(() => false)).toBe("false")
    })

    it("handles object", () => {
      const testObject = { someProperty: "someValue" }

      expect(handleInfo(testObject)).toBe(JSON.stringify(testObject))
    })
  })
})
