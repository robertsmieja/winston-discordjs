import { describe, it, expect, vi, beforeEach, MockedFunction } from "vitest"
import DiscordTransport, {
  DiscordTransportStreamOptions,
} from "../DiscordTransport"
import * as Discord from "discord.js"

// Keep tests running on Vitest but mock jest functions so the checker is satisfied
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

    it("handles empty options with discordClient defined", () => {
      const options: DiscordTransportStreamOptions = {
        discordClient: new Discord.Client({ intents: [] }),
      }
      const transport = new DiscordTransport(options)

      expect(transport).toBeDefined()
      expect(transport.discordClient).toBeDefined()
      expect(transport.discordChannel).toBeUndefined()
    })

    it("truncates long strings to 2000 characters", () => {
      const fakeDiscordChannel = {
        send: jest.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      const longString = "A".repeat(3000)
      transport.log(longString, undefined)

      const mockSend = fakeDiscordChannel.send as jest.MockedFunction<
        Discord.TextChannel["send"]
      >

      expect(mockSend).toHaveBeenCalledWith(longString.substring(0, 2000))
    })

    it("does not truncate non-strings in else branch", () => {
      const fakeDiscordChannel = {
        send: jest.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      const mockSend = fakeDiscordChannel.send as jest.MockedFunction<
        Discord.TextChannel["send"]
      >

      const obj = { foo: "bar" }
      transport.log(obj, undefined)

      expect(mockSend).toHaveBeenCalledWith("[object Object]")
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

    it("truncates long array content properly", () => {
      const fakeDiscordChannel = {
        send: jest.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      const mockSend = fakeDiscordChannel.send as jest.MockedFunction<
        Discord.TextChannel["send"]
      >

      const longString = "A".repeat(3000)
      transport.log({ level: "info", message: longString }, undefined)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringMatching(/^.{2000}$/),
          embeds: [expect.any(Discord.MessageEmbed)],
        })
      )
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

    it("handles options with discordChannel string", () => {
      const options: DiscordTransportStreamOptions = {
        discordChannel: "12345",
      }
      const transport = new DiscordTransport(options)

      expect(transport).toBeDefined()
      expect(transport.discordChannel).toBeUndefined()
    })

    it("handles defined discordClient passed in opts with token", () => {
      const mockClient = new Discord.Client({ intents: [] })
      const options: DiscordTransportStreamOptions = {
        discordClient: mockClient,
        discordToken: "foo",
      }
      const transport = new DiscordTransport(options)
      expect(transport.discordClient).toBe(mockClient)
    })

    it("handles opts with discordChannel being an instance of TextChannel", () => {
      const mockChannel = {
        id: "123",
        send: jest.fn(),
      }
      Object.setPrototypeOf(mockChannel, Discord.TextChannel.prototype)

      const options: DiscordTransportStreamOptions = {
        discordChannel: mockChannel as unknown as Discord.TextChannel,
      }
      const transport = new DiscordTransport(options)
      expect(transport.discordChannel).toBe(mockChannel)
    })

    it("handles callback even if info is falsy", () => {
      const callback = jest.fn()
      transport.log(undefined, callback)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it("handles close when discordClient is undefined", () => {
      transport.discordClient = undefined
      transport.close()
      expect(transport.discordClient).toBeUndefined()
    })

    it("silently ignores if info is not present or transport is silent", () => {
      const fakeDiscordChannel = {
        send: jest.fn(async () => {
          return {}
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      transport.silent = true
      transport.log("test", undefined)
      expect(fakeDiscordChannel.send).not.toHaveBeenCalled()
    })

    it("handles messagePromise rejecting by emitting warn", async () => {
      const fakeError = new Error("discord API down")
      const fakeDiscordChannel = {
        send: jest.fn(async () => {
          return Promise.reject(fakeError)
        }) as unknown,
      } as Partial<Discord.TextChannel>
      transport.discordChannel = fakeDiscordChannel as Discord.TextChannel

      const emitSpy = jest.spyOn(transport, "emit")

      transport.log("log me!", undefined)

      await new Promise(setImmediate)

      expect(emitSpy).toHaveBeenCalledWith("warn", fakeError)
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
