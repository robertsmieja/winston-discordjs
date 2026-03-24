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
  const otherFields: string[] = []

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    if (field === "timestamp") hasTimestamp = true
    else if (field === "level") hasLevel = true
    else if (field === "message") hasMessage = true
    else otherFields.push(field)
  }

  const result: string[] = []
  if (hasTimestamp) result.push("timestamp")
  if (hasLevel) result.push("level")
  if (hasMessage) result.push("message")

  for (let i = 0; i < otherFields.length; i++) {
    result.push(otherFields[i])
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

    const capitalize = (str: string): string =>
      str.charAt(0).toLocaleUpperCase() + str.slice(1)

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      if (info[field]) {
        const capitalizedField = capitalize(field)
        const value = info[field]

        logMessageParts.push(`${capitalizedField}: ${value}`)
        messageEmbed.addField(capitalizedField, value.toString(), true)
      }
    }

    return [logMessageParts.join(", "), messageEmbed]
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
