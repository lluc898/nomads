import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "join_request",
  "join_accepted",
  "join_rejected",
  "participant_joined",
  "chat_message",
]);

export const notificationSchema = z.object({
  id: z.uuid(),
  type: notificationTypeSchema,
  tripSlug: z.string().min(1),
  tripTitle: z.string().min(1),
  actorName: z.string().nullable(),
  actorImage: z.string().nullable(),
  preview: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.iso.datetime(),
});

export const notificationCenterSchema = z.object({
  notifications: z.array(notificationSchema),
  unreadCount: z.number().int().nonnegative(),
});

export const markNotificationsReadSchema = z.union([
  z.object({ notificationId: z.uuid() }),
  z.object({ all: z.literal(true) }),
]);

export const pushTokenInputSchema = z.object({
  token: z.string().min(10).max(255),
  platform: z.enum(["ios", "android"]),
  locale: z.enum(["es", "en", "ca", "fr", "de", "it", "pt", "nl"]),
});

export const tripNotificationPreferencesSchema = z.object({
  chatMuted: z.boolean(),
});

export type AppNotification = z.infer<typeof notificationSchema>;
export type NotificationCenter = z.infer<typeof notificationCenterSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type TripNotificationPreferences = z.infer<
  typeof tripNotificationPreferencesSchema
>;
