import { describe, it, expect, vi, beforeEach, MockedFunction } from "vitest"
import DiscordTransport, {
  DiscordTransportStreamOptions,
} from "../DiscordTransport"
import * as Discord from "discord.js"
;(globalThis as any).jest = vi
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

      const fakeChannelManager = {} as Partial<Discord.ChannelManager>

      const fakeDiscordClient = {
        login: vi.fn(),
        on: vi.fn(),
      } as Partial<Discord.Client>
      fakeDiscordClient.channels = fakeChannelManager as Discord.ChannelManager

      const transport = new DiscordTransport(options)

      expect(transport).toBeDefined()
      expect(transport.discordChannel).toBeUndefined()
      expect(transport.discordClient).toBeDefined()

      const discordClient = transport.discordClient as typeof fakeDiscordClient

      const mockedLogin = discordClient.login as MockedFunction<
        (typeof Discord.Client)["prototype"]["login"]
      >
      const mockedOn = discordClient.on as MockedFunction<
        (typeof Discord.Client)["prototype"]["on"]
      >

      expect(mockedLogin).toHaveBeenCalledTimes(1)
      expect(mockedLogin).toHaveBeenCalledWith(options.discordToken)
      expect(mockedOn).toHaveBeenCalledTimes(1)
      expect(mockedOn).toHaveBeenCalledWith("error", expect.any(Function))
    })

    it("emits warn event when discordClient emits error", () => {
      const options: DiscordTransportStreamOptions = {
        discordToken: "EXAMPLE_API_TOKEN",
      }

      // Recreate how discordClient is handled in the previous test
      const fakeDiscordClient = {
        login: jest.fn(),
        on: jest.fn(),
      } as Partial<Discord.Client>

      // temporarily override the mock so we control `on`
      jest.spyOn(Discord, "Client").mockImplementationOnce(function () {
        return fakeDiscordClient as any
      })

      const transport = new DiscordTransport(options)

      const discordClientOn = fakeDiscordClient.on as jest.MockedFunction<
        (typeof Discord.Client)["prototype"]["on"]
      >

      const fakeError = new Error("discord client error")

      const emitSpy = jest.spyOn(transport, "emit")

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

      expect(mockSend).toHaveBeenCalledWith("log me!")
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
      })
    })

    it("truncates array string content to 2000 characters", () => {
      const fakeDiscordChannel = {
        send: vi.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      const longMessage = "A".repeat(3000)
      transport.log({ level: "info", message: longMessage }, undefined)

      const mockSend = fakeDiscordChannel.send as MockedFunction<
        Discord.TextChannel["send"]
      >

      expect(mockSend).toHaveBeenCalledWith({
        content: expect.stringMatching(/^Level: info, Message: A{1978}$/),
        embeds: [expect.any(Discord.MessageEmbed)],
      })
      // Double check exact length: "Level: info, Message: " is 22 chars
      // 2000 - 22 = 1978
      expect(mockSend.mock.calls[0][0].content.length).toBe(2000)
    })

    it("truncates simple string content to 2000 characters", () => {
      const fakeDiscordChannel = {
        send: vi.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      const longMessage = "A".repeat(3000)
      transport.log(longMessage, undefined)

      const mockSend = fakeDiscordChannel.send as MockedFunction<
        Discord.TextChannel["send"]
      >

      expect(mockSend).toHaveBeenCalledWith("A".repeat(2000))
    })

    it("handles non-string array content without failing", async () => {
      const LogHandlers = await import("../LogHandlers")
      const spy = vi
        .spyOn(LogHandlers, "handleInfo")
        .mockReturnValue([123 as any, new Discord.MessageEmbed()])

      const fakeDiscordChannel = {
        send: vi.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      transport.log("foo", undefined)

      expect(fakeDiscordChannel.send).toHaveBeenCalled()
      spy.mockRestore()
    })

    it("handles non-string simple content without failing", async () => {
      const LogHandlers = await import("../LogHandlers")
      const spy = vi
        .spyOn(LogHandlers, "handleInfo")
        .mockReturnValue(123 as any)

      const fakeDiscordChannel = {
        send: vi.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      transport.log("foo", undefined)

      expect(fakeDiscordChannel.send).toHaveBeenCalled()
      spy.mockRestore()
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
          expect(mockSend).toHaveBeenCalledWith("log me!")
          resolve()
        })
        transport.log("log me!", undefined)
      })
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

      expect(mockSend).toHaveBeenCalledWith("log me!")
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

      expect(mockSend).toHaveBeenCalledWith("log me!")
    })

    describe("close()", () => {
      let transport: DiscordTransport
      beforeEach(() => {
        transport = new DiscordTransport()
      })
      it("destroys discordClient if defined", () => {
        const mockClient = new Discord.Client({ intents: [] })
        mockClient.destroy = vi.fn()

        transport.discordClient = mockClient
        transport.close()

        expect(mockClient.destroy).toHaveBeenCalledTimes(1)
      })

      it("handles undefined discordClient", () => {
        transport.discordClient = undefined
        expect(() => transport.close()).not.toThrow()
      })
    })
  })
})
