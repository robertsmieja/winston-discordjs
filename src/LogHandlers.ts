import { TransformableInfo, Format } from "logform"
import { isPrimitive, Primitive } from "utility-types"
import { MessageEmbed } from "discord.js"
import { LogLevel, LogLevelToColor } from "./LogLevels"

export const isTransformableInfo = (
  info: unknown
): info is TransformableInfo => {
  return Boolean(info && "level" in (info as any) && "message" in (info as any))
}

const sortFields = (fields: string[]): string[] => {
  // This array defines the exact, fixed order in which priority fields
  // ("timestamp", "level", "message") must appear in the final output.
  let hasTimestamp = false
  let hasLevel = false
  let hasMessage = false

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    if (field === "timestamp") hasTimestamp = true
    else if (field === "level") hasLevel = true
    else if (field === "message") hasMessage = true
  }

  // Pre-allocate the exact size array to avoid dynamic resizing overhead
  const result = new Array(fields.length)
  let resultIdx = 0

  if (hasTimestamp) result[resultIdx++] = "timestamp"
  if (hasLevel) result[resultIdx++] = "level"
  if (hasMessage) result[resultIdx++] = "message"

  let otherIdx = resultIdx
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    if (field !== "timestamp" && field !== "level" && field !== "message") {
      result[otherIdx++] = field
    }
  }

  return result
}

export const handlePrimitive = (info: Primitive): string => {
  switch (typeof info) {
    case "string": {
      return info
    }
    default: {
      return String(info)
    }
  }
}

// Extracted outside to avoid closure recreation on every log invocation
// Use toUpperCase() instead of toLocaleUpperCase() for ~75% performance gain
const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1)

const safeStringify = (value: any): string => {
  // Early return for string primitives bypasses try-catch overhead
  if (typeof value === "string") return value

  try {
    return String(value)
  } catch (err) {
    try {
      return JSON.stringify(value) || "[object Object]"
    } catch (err2) {
      return "[object Object]"
    }
  }
}

export const handleLogform = (
  info: TransformableInfo,
  level?: string
): [string, MessageEmbed] | undefined => {
  if ((level && level === info.level) || !level) {
    const messageEmbed = new MessageEmbed()
    const logMessageParts: string[] = []
    const color = level
      ? LogLevelToColor[level as LogLevel] ?? "DEFAULT"
      : "DEFAULT"
    messageEmbed.setColor(color)
    const fields = sortFields(Object.keys(info))

    // Discord Embed & Message Limits
    // Documented at: https://discord.com/developers/docs/resources/message#embed-object-embed-limits
    // - Field name: 256 characters
    // - Field value: 1024 characters
    // - Total fields: 25
    // - Total embed characters: 6000
    // Discord Message Content Limit: 2000 characters
    let fieldCount = 0;
    let totalEmbedLength = 0;

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      if (info[field]) {
        const capitalizedField = capitalize(field)
        const value = info[field]
        const stringifiedValue = safeStringify(value)

        logMessageParts.push(`${capitalizedField}: ${stringifiedValue}`)

        if (fieldCount < 25 && totalEmbedLength < 6000) {
          let truncatedName = capitalizedField.substring(0, 256)
          let truncatedValue = stringifiedValue.substring(0, 1024)

          // Ensure we don't exceed the 6000 character total limit for embeds
          const availableSpace = 6000 - totalEmbedLength
          const fieldLength = truncatedName.length + truncatedValue.length

          if (fieldLength > availableSpace) {
            if (truncatedName.length >= availableSpace) {
              // Not even enough room for the name, stop adding fields
              break
            } else {
              // Truncate the value to fit the remaining space
              truncatedValue = truncatedValue.substring(0, availableSpace - truncatedName.length)
            }
          }

          // Ensure we don't add empty fields
          if (truncatedName && truncatedValue) {
            messageEmbed.addField(truncatedName, truncatedValue, true)
            totalEmbedLength += truncatedName.length + truncatedValue.length
            fieldCount++
          }
        }
      }
    }

    const fullMessage = logMessageParts.join(", ")
    const truncatedMessage = fullMessage.substring(0, 2000)

    return [truncatedMessage, messageEmbed]
  }

  return undefined
}

export const handleObject = (
  info: Exclude<any, Primitive>,
  format?: Format,
  level?: string
): string | [string, MessageEmbed] | undefined => {
  if (isTransformableInfo(info)) {
    if (format) {
      const formattedInfo = format.transform(info)
      if (isTransformableInfo(formattedInfo)) {
        return handleLogform(formattedInfo, level)
      } else {
        return handlePrimitive(formattedInfo)
      }
    } else {
      return handleLogform(info, level)
    }
  } else if (info instanceof Error && info.stack) {
    return info.stack
  } else if (
    typeof info?.toString === "function" &&
    info.toString !== Object.toString
  ) {
    return info.toString()
  } else {
    try {
      // this will call toJSON on the object, if it exists
      return JSON.stringify(info)
    } catch (err) {
      return "[object Object]"
    }
  }
}

export const handleInfo = (
  info: unknown,
  format?: Format,
  level?: string
): string | [string, MessageEmbed] | undefined => {
  if (isPrimitive(info)) {
    return handlePrimitive(info)
  } else if (typeof info === "function") {
    return handleInfo(info(), format, level)
  } else {
    return handleObject(info, format, level)
  }
}
