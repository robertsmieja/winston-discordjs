import { describe, it, expect, vi, beforeEach, MockedFunction } from "vitest"
import DiscordTransport, {
  DiscordTransportStreamOptions,
} from "../DiscordTransport"
import * as Discord from "discord.js"
import * as logform from "logform"

vi.mock("discord.js")

describe("DiscordTransport", () => {
  describe("constructor", () => {
    it("handles undefined successfully", () => {
      const transport = new DiscordTransport(undefined)

      expect(transport).toBeDefined()
      expect(transport.discordChannel).toBeUndefined()
      expect(transport.discordClient).toBeUndefined()
    })

    it("handles empty options successfully", () => {
      const options: DiscordTransportStreamOptions = {}
      const transport = new DiscordTransport(options)

      expect(transport).toBeDefined()
      expect(transport.discordChannel).toBeUndefined()
      expect(transport.discordClient).toBeUndefined()
    })

    it("handles Discord API Token successfully", () => {
      const options: DiscordTransportStreamOptions = {
        discordToken: "EXAMPLE_API_TOKEN",
        discordChannel: "12345",
      }

      const fakeChannelManager = {
        fetch: vi.fn(() => Promise.resolve(null)),
      } as Partial<Discord.ChannelManager>

      const fakeDiscordClient = {
        login: vi.fn(() => Promise.resolve("token")),
        on: vi.fn(),
      } as Partial<Discord.Client>
      fakeDiscordClient.channels = fakeChannelManager as Discord.ChannelManager

      vi.spyOn(Discord, "Client").mockImplementationOnce(function (this: any) {
        this.login = fakeDiscordClient.login
        this.on = fakeDiscordClient.on
        this.channels = fakeDiscordClient.channels
        return this
      } as any)

      const transport = new DiscordTransport(options)

      expect(transport).toBeDefined()
      expect(transport.discordChannel).toBeUndefined()
      expect(transport.discordClient).toBeDefined()

      const discordClient = transport.discordClient as typeof fakeDiscordClient

      const mockedLogin = discordClient.login as MockedFunction<any>
      const mockedOn = discordClient.on as MockedFunction<any>

      expect(mockedLogin).toHaveBeenCalledTimes(1)
      expect(mockedLogin).toHaveBeenCalledWith(options.discordToken)
      expect(mockedOn).toHaveBeenCalledTimes(1)
      expect(mockedOn).toHaveBeenCalledWith("error", expect.any(Function))
      expect(fakeChannelManager.fetch).toHaveBeenCalledWith("12345")
    })

    it("resolves a channel ID and delivers logs queued during the fetch", async () => {
      let resolveChannel!: (channel: Discord.TextChannel) => void
      const channelPromise = new Promise<Discord.TextChannel>((resolve) => {
        resolveChannel = resolve
      })
      const send = vi.fn(async () => ({}))
      const channel = Object.create(
        Discord.TextChannel.prototype
      ) as Discord.TextChannel
      channel.send = send as Discord.TextChannel["send"]
      const client = {
        channels: { fetch: vi.fn(() => channelPromise) },
        destroy: vi.fn(),
      } as unknown as Discord.Client

      const transport = new DiscordTransport({
        discordClient: client,
        discordChannel: "12345",
      })
      transport.log("queued log")
      resolveChannel(channel)

      await vi.waitFor(() => {
        expect(send).toHaveBeenCalledWith({
          content: "queued log",
          allowedMentions: { parse: [] },
        })
      })
      expect(client.channels.fetch).toHaveBeenCalledWith("12345")
    })

    it("emits warn when resolving a channel ID fails", async () => {
      const fakeError = new Error("channel fetch failed")
      const client = {
        channels: { fetch: vi.fn(() => Promise.reject(fakeError)) },
      } as unknown as Discord.Client
      const transport = new DiscordTransport({
        discordClient: client,
        discordChannel: "12345",
      })
      const warn = vi.fn()
      transport.on("warn", warn)

      await vi.waitFor(() => {
        expect(warn).toHaveBeenCalledWith(fakeError)
      })
    })

    it("emits warn when Discord login rejects", async () => {
      const options: DiscordTransportStreamOptions = {
        discordToken: "EXAMPLE_API_TOKEN",
      }
      let rejectLogin!: (reason?: unknown) => void
      const loginPromise = new Promise<string>((_, reject) => {
        rejectLogin = reject
      })
      const fakeDiscordClient = {
        login: vi.fn(() => loginPromise),
        on: vi.fn(),
      } as unknown as Partial<Discord.Client>

      vi.spyOn(Discord, "Client").mockImplementationOnce(function (this: any) {
        this.login = fakeDiscordClient.login
        this.on = fakeDiscordClient.on
        return this
      } as any)

      const transport = new DiscordTransport(options)
      const warn = vi.fn()
      transport.on("warn", warn)

      const fakeError = new Error("Discord login failed")
      rejectLogin(fakeError)

      await vi.waitFor(() => {
        expect(warn).toHaveBeenCalledWith(fakeError)
      })
    })

    it("emits warn event when discordClient emits error", () => {
      const options: DiscordTransportStreamOptions = {
        discordToken: "EXAMPLE_API_TOKEN",
      }

      // Recreate how discordClient is handled in the previous test
      const fakeDiscordClient = {
        login: vi.fn(() => Promise.resolve("token")),
        on: vi.fn(),
      } as Partial<Discord.Client>

      // temporarily override the mock so we control `on`
      vi.spyOn(Discord, "Client").mockImplementationOnce(function (this: any) {
        this.login = fakeDiscordClient.login
        this.on = fakeDiscordClient.on
        return this
      } as any)

      const transport = new DiscordTransport(options)

      const discordClientOn = fakeDiscordClient.on as MockedFunction<
        (typeof Discord.Client)["prototype"]["on"]
      >

      const fakeError = new Error("discord client error")

      const emitSpy = vi.spyOn(transport, "emit")

      const errorCallback = discordClientOn.mock.calls.find(
        (call) => call[0] === "error"
      )?.[1] as (error: Error) => void

      expect(errorCallback).toBeDefined()
      if (errorCallback) {
        errorCallback(fakeError)
      }
      expect(emitSpy).toHaveBeenCalledWith("warn", fakeError)
    })
  })

  describe("log()", () => {
    let transport: DiscordTransport
    beforeEach(() => {
      transport = new DiscordTransport()
    })

    it("handles (undefined, undefined) correctly", () => {
      const fakeDiscordChannel = {
        send: vi.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      transport.log(undefined, undefined)

      const mockSend = fakeDiscordChannel.send as MockedFunction<
        Discord.TextChannel["send"]
      >

      expect(mockSend).not.toHaveBeenCalled()
    })

    it("handles (string, undefined) correctly", () => {
      const fakeDiscordChannel = {
        send: vi.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      transport.log("log me!", undefined)

      const mockSend = fakeDiscordChannel.send as MockedFunction<
        Discord.TextChannel["send"]
      >

      expect(mockSend).toHaveBeenCalledWith({
        content: "log me!",
        allowedMentions: { parse: [] },
      })
    })

    it.each([
      [false, "false"],
      [0, "0"],
    ])("sends the falsy primitive %j", (value, expectedContent) => {
      const send = vi.fn(async () => ({}))
      transport.discordChannel = { send } as unknown as Discord.TextChannel

      transport.log(value)

      expect(send).toHaveBeenCalledWith({
        content: expectedContent,
        allowedMentions: { parse: [] },
      })
    })

    it("sends custom object output as string content", () => {
      const fakeDiscordChannel = {
        send: vi.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      transport.log({ toString: () => 123 } as any, undefined)

      const mockSend = fakeDiscordChannel.send as MockedFunction<
        Discord.TextChannel["send"]
      >
      expect(mockSend).toHaveBeenCalledWith({
        content: "123",
        allowedMentions: { parse: [] },
      })
    })

    it("handles log messages with embeds correctly", () => {
      const fakeDiscordChannel = {
        send: vi.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      transport.log({ level: "info", message: "log me!" }, undefined)

      const mockSend = fakeDiscordChannel.send as MockedFunction<
        Discord.TextChannel["send"]
      >

      expect(mockSend).toHaveBeenCalledWith({
        content: "Level: info, Message: log me!",
        embeds: [expect.any(Discord.MessageEmbed)],
        allowedMentions: { parse: [] },
      })
    })

    it("handles send() throwing an error", () => {
      return new Promise<void>((resolve) => {
        const fakeError = new Error("fake error")

        const fakeDiscordChannel = {
          send: vi.fn(async () => {
            throw fakeError
          }) as unknown,
        } as Partial<Discord.TextChannel>
        transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

        const mockSend = fakeDiscordChannel.send as MockedFunction<
          Discord.TextChannel["send"]
        >

        transport.discordChannel = fakeDiscordChannel as Discord.TextChannel
        transport.on("warn", (error) => {
          expect(error).toStrictEqual(fakeError)
          expect(mockSend).toHaveBeenCalledWith({
            content: "log me!",
            allowedMentions: { parse: [] },
          })
          resolve()
        })
        transport.log("log me!", undefined)
      })
    })

    it("handles a synchronous send() error", () => {
      const fakeError = new Error("sync send error")
      const send = vi.fn(() => {
        throw fakeError
      })
      transport.discordChannel = { send } as unknown as Discord.TextChannel
      const warn = vi.fn()
      transport.on("warn", warn)

      expect(() => transport.log("log me!")).not.toThrow()
      expect(warn).toHaveBeenCalledWith(fakeError)
    })

    it("emits warn and suppresses output when a formatter throws", () => {
      const fakeError = new Error("format failed")
      const format = logform.format(() => {
        throw fakeError
      })()
      const send = vi.fn(async () => ({}))
      transport = new DiscordTransport({ format })
      transport.discordChannel = { send } as unknown as Discord.TextChannel
      const warn = vi.fn()
      transport.on("warn", warn)

      transport.log({ level: "info", message: "sensitive" })

      expect(warn).toHaveBeenCalledWith(fakeError)
      expect(send).not.toHaveBeenCalled()
    })

    it("handles (string, () => {})) correctly", () => {
      const callback = vi.fn()

      const fakeDiscordChannel = {
        send: vi.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      transport.log("log me!", undefined)

      const mockSend = fakeDiscordChannel.send as MockedFunction<
        Discord.TextChannel["send"]
      >

      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel
      transport.log("log me!", callback)

      expect(mockSend).toHaveBeenCalledWith({
        content: "log me!",
        allowedMentions: { parse: [] },
      })
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it("handles (string, object) correctly", () => {
      const fakeDiscordChannel = {
        send: vi.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      const mockSend = fakeDiscordChannel.send as MockedFunction<
        Discord.TextChannel["send"]
      >

      // pass a truthy non-function object as callback
      expect(() => {
        transport.log("log me!", {} as any)
      }).not.toThrow()

      expect(mockSend).toHaveBeenCalledWith({
        content: "log me!",
        allowedMentions: { parse: [] },
      })
    })

    describe("close()", () => {
      let transport: DiscordTransport
      beforeEach(() => {
        transport = new DiscordTransport()
      })
      it("destroys a client created by the transport", () => {
        const destroy = vi.fn()
        vi.spyOn(Discord, "Client").mockImplementationOnce(function (
          this: any
        ) {
          this.login = vi.fn(() => Promise.resolve("token"))
          this.on = vi.fn()
          this.destroy = destroy
          return this
        } as any)

        transport = new DiscordTransport({ discordToken: "token" })
        transport.close()

        expect(destroy).toHaveBeenCalledTimes(1)
      })

      it("does not destroy a caller-owned client", () => {
        const client = {
          destroy: vi.fn(),
        } as unknown as Discord.Client

        transport = new DiscordTransport({ discordClient: client })
        transport.close()

        expect(client.destroy).not.toHaveBeenCalled()
      })

      it("does not send queued logs after close", async () => {
        let resolveChannel!: (channel: Discord.TextChannel) => void
        const channelPromise = new Promise<Discord.TextChannel>((resolve) => {
          resolveChannel = resolve
        })
        const send = vi.fn(async () => ({}))
        const channel = Object.create(
          Discord.TextChannel.prototype
        ) as Discord.TextChannel
        channel.send = send as Discord.TextChannel["send"]
        const destroy = vi.fn()

        vi.spyOn(Discord, "Client").mockImplementationOnce(function (
          this: any
        ) {
          this.login = vi.fn(() => Promise.resolve("token"))
          this.on = vi.fn()
          this.destroy = destroy
          this.channels = { fetch: vi.fn(() => channelPromise) }
          return this
        } as any)

        transport = new DiscordTransport({
          discordToken: "token",
          discordChannel: "12345",
        })
        transport.log("queued log")
        transport.close()
        resolveChannel(channel)
        await channelPromise
        await Promise.resolve()

        expect(destroy).toHaveBeenCalledTimes(1)
        expect(send).not.toHaveBeenCalled()
      })

      it("handles undefined discordClient", () => {
        transport.discordClient = undefined
        expect(() => transport.close()).not.toThrow()
      })
    })
  })
})
