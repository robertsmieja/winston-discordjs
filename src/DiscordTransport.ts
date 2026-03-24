import {
  TextChannel,
  Client,
  BitFieldResolvable,
  IntentsString,
  Message,
} from "discord.js"
import TransportStream from "winston-transport"
import { handleInfo } from "./LogHandlers"

export interface DiscordTransportStreamOptions
  extends TransportStream.TransportStreamOptions {
  discordClient?: Client
  discordToken?: string
  discordChannel?: string | TextChannel
  intents?: BitFieldResolvable<IntentsString, number>
}

export class DiscordTransport extends TransportStream {
  discordChannel?: TextChannel
  discordClient?: Client

  constructor(opts?: DiscordTransportStreamOptions) {
    super(opts)

    if (opts) {
      const { discordChannel, discordToken, intents = [] } = opts
      if (opts.discordClient) {
        this.discordClient = opts.discordClient
      } else {
        if (discordToken) {
          this.discordClient = new Client({ intents })
          this.discordClient.on("error", (error) => {
            this.emit("warn", error)
          })
          this.discordClient.login(discordToken)
        }
      }

      if (discordChannel && discordChannel instanceof TextChannel) {
        this.discordChannel = discordChannel
      }
    }
  }

  log(info: unknown, callback?: () => void): void {
    setImmediate(() => {
      this.emit("logged", info)
    })

    if (!this.silent && info) {
      const logMessage = handleInfo(info, this.format, this.level)

      if (this.discordChannel && logMessage) {
        let messagePromise: Promise<Message>
        if (Array.isArray(logMessage)) {
          // Discord Message Content Limit: 2000 characters
          // Documented at: https://discord.com/developers/docs/resources/message#create-message
          const content = typeof logMessage[0] === 'string' ? logMessage[0].substring(0, 2000) : logMessage[0]
          const embed = logMessage[1]
          messagePromise = this.discordChannel.send({
            content,
            embeds: [embed],
          })
        } else {
          // Discord Message Content Limit: 2000 characters
          // Documented at: https://discord.com/developers/docs/resources/message#create-message
          const content = typeof logMessage === 'string' ? logMessage.substring(0, 2000) : logMessage
          messagePromise = this.discordChannel.send(content)
        }
        messagePromise.catch((error) => {
          this.emit("warn", error)
        })
      }
    }

    if (callback && typeof callback === "function") {
      callback()
    }
  }

  close(): void {
    if (this.discordClient) {
      this.discordClient.destroy()
    }
  }
}

export default DiscordTransport
