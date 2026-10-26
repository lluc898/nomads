import { z } from "zod";

export const CHAT_MESSAGE_MAX_LENGTH = 1_000;

export const sendChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(CHAT_MESSAGE_MAX_LENGTH),
});

export const chatMessageSchema = z.object({
  id: z.uuid(),
  content: z.string().min(1),
  createdAt: z.iso.datetime(),
  isOwn: z.boolean(),
  author: z.object({
    userId: z.uuid(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    image: z.string().nullable(),
  }),
});

export const tripChatSchema = z.object({
  messages: z.array(chatMessageSchema),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type TripChat = z.infer<typeof tripChatSchema>;
export type SendChatMessage = z.infer<typeof sendChatMessageSchema>;
