import { describe, expect, it } from "vitest";

import { CHAT_MESSAGE_MAX_LENGTH, sendChatMessageSchema } from "./chat";

describe("sendChatMessageSchema", () => {
  it("trims valid messages", () => {
    expect(sendChatMessageSchema.parse({ content: "  Hola grupo  " })).toEqual({
      content: "Hola grupo",
    });
  });

  it("rejects empty and oversized messages", () => {
    expect(sendChatMessageSchema.safeParse({ content: "   " }).success).toBe(
      false,
    );
    expect(
      sendChatMessageSchema.safeParse({
        content: "a".repeat(CHAT_MESSAGE_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });
});
