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
  private discordChannelPromise?: Promise<TextChannel | undefined>
  private ownsDiscordClient = false

  constructor(opts?: DiscordTransportStreamOptions) {
    super(opts)

    if (opts) {
      const { discordChannel, discordToken, intents = [] } = opts
      if (opts.discordClient) {
        this.discordClient = opts.discordClient
      } else {
        if (discordToken) {
          this.discordClient = new Client({ intents })
          this.ownsDiscordClient = true
          this.discordClient.on("error", (error) => {
            this.emit("warn", error)
          })
          void this.discordClient.login(discordToken).catch((error) => {
            this.emit("warn", error)
          })
        }
      }

      if (discordChannel && discordChannel instanceof TextChannel) {
        this.discordChannel = discordChannel
      } else if (typeof discordChannel === "string" && this.discordClient) {
        this.discordChannelPromise = this.discordClient.channels
          .fetch(discordChannel)
          .then((channel) => {
            if (channel instanceof TextChannel) {
              this.discordChannel = channel
              return channel
            }

            this.emit(
              "warn",
              new TypeError(`Discord channel ${discordChannel} is not a text channel`)
            )
            return undefined
          })
          .catch((error) => {
            this.emit("warn", error)
            return undefined
          })
      }
    }
  }

  private send(
    channel: TextChannel,
    logMessage: Exclude<ReturnType<typeof handleInfo>, undefined>
  ): void {
    try {
      let messagePromise: Promise<Message>
      if (Array.isArray(logMessage)) {
        const content = logMessage[0]
        const embed = logMessage[1]
        messagePromise = channel.send({
          content,
          embeds: [embed],
          allowedMentions: { parse: [] },
        })
      } else {
        messagePromise = channel.send({
          content: logMessage,
          allowedMentions: { parse: [] },
        })
      }
      void messagePromise.catch((error) => {
        this.emit("warn", error)
      })
    } catch (error) {
      this.emit("warn", error)
    }
  }

  log(info: unknown, callback?: () => void): void {
    setImmediate(() => {
      this.emit("logged", info)
    })

    if (!this.silent && info !== undefined && info !== null) {
      let logMessage: ReturnType<typeof handleInfo>
      try {
        logMessage = handleInfo(info, this.format, this.level)
      } catch (error) {
        this.emit("warn", error)
        logMessage = undefined
      }

      if (this.discordChannel && logMessage) {
        this.send(this.discordChannel, logMessage)
      } else if (this.discordChannelPromise && logMessage) {
        void this.discordChannelPromise.then((channel) => {
          if (channel) this.send(channel, logMessage)
        })
      }
    }

    if (callback && typeof callback === "function") {
      callback()
    }
  }

  close(): void {
    if (this.discordClient && this.ownsDiscordClient) {
      this.discordClient.destroy()
    }
  }
}

export default DiscordTransport
