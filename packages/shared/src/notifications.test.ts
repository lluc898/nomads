import { describe, expect, it } from "vitest";

import {
  markNotificationsReadSchema,
  notificationCenterSchema,
  pushTokenInputSchema,
} from "./notifications";

describe("notification contracts", () => {
  it("accepts a notification center response", () => {
    expect(
      notificationCenterSchema.parse({
        unreadCount: 1,
        notifications: [
          {
            id: "48fdfc49-3ae4-4dd6-a053-a05e37bb0692",
            type: "join_request",
            tripSlug: "mallorca-turquia",
            tripTitle: "Viaje a Turquía",
            actorName: "Lluc",
            actorImage: null,
            preview: null,
            isRead: false,
            createdAt: "2026-10-27T12:00:00.000Z",
          },
        ],
      }).unreadCount,
    ).toBe(1);
  });

  it("validates read actions and Expo push tokens", () => {
    expect(markNotificationsReadSchema.parse({ all: true })).toEqual({
      all: true,
    });
    expect(
      pushTokenInputSchema.safeParse({
        token: "ExponentPushToken[example]",
        platform: "ios",
        locale: "es",
      }).success,
    ).toBe(true);
  });
});
