import {
  createdTripSchema,
  chatMessageSchema,
  createTripInputSchema,
  isSupportedLocale,
  mobileProfileSchema,
  notificationCenterSchema,
  publicProfileSchema,
  sendChatMessageSchema,
  type SupportedLocale,
  travelLocationSchema,
  tripCardSchema,
  tripDetailSchema,
  tripJoinResultSchema,
  tripJoinReviewSchema,
  tripNotificationPreferencesSchema,
  tripChatSchema,
  type CreateTripInput,
  type ChatMessage,
  type MobileProfile,
  type NotificationCenter,
  type PublicProfile,
  type TravelLocation,
  type TripCard,
  type TripDetail,
  type TripJoinReview,
  type TripNotificationPreferences,
  type TripChat,
} from "@viajeroshub/shared";

export interface ApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export function createApiClient({
  baseUrl,
  fetcher = fetch,
}: ApiClientOptions) {
  return {
    async getPublicProfile(username: string): Promise<PublicProfile> {
      const response = await fetcher(
        `${baseUrl}/profiles/${encodeURIComponent(username)}`,
      );
      if (!response.ok) throw await apiError(response);
      return publicProfileSchema.parse(await response.json());
    },

    async searchLocations(
      query: string,
      options: { includeAnywhere?: boolean; locale?: SupportedLocale } = {},
    ): Promise<TravelLocation[]> {
      const search = new URLSearchParams({ q: query });
      if (options.includeAnywhere) search.set("includeAnywhere", "true");
      if (options.locale) search.set("locale", options.locale);
      const response = await fetcher(`${baseUrl}/locations?${search}`);
      if (!response.ok) throw await apiError(response);
      return travelLocationSchema.array().parse(await response.json());
    },

    async detectLocale(): Promise<SupportedLocale> {
      const response = await fetcher(`${baseUrl}/locale`);
      if (!response.ok) throw await apiError(response);
      const payload = (await response.json()) as { locale?: unknown };
      return isSupportedLocale(payload.locale) ? payload.locale : "en";
    },

    async listTrips(
      options: {
        origin?: string;
        destination?: string;
        departureDate?: string;
        returnDate?: string;
        flexibleMonth?: string;
        locale?: SupportedLocale;
      } = {},
    ): Promise<TripCard[]> {
      const search = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value) search.set(key, value);
      });
      const response = await fetcher(`${baseUrl}/trips?${search}`);
      if (!response.ok) {
        throw new Error(
          `No se pudieron cargar los viajes (${response.status})`,
        );
      }
      return tripCardSchema.array().parse(await response.json());
    },

    async createTrip(token: string, input: CreateTripInput) {
      const body = createTripInputSchema.parse(input);
      const response = await fetcher(`${baseUrl}/trips`, {
        method: "POST",
        headers: {
          ...authorization(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw await apiError(response);
      return createdTripSchema.parse(await response.json());
    },

    async listMyTrips(token: string, locale?: SupportedLocale) {
      const search = new URLSearchParams({ mine: "true" });
      if (locale) search.set("locale", locale);
      const response = await fetcher(`${baseUrl}/trips?${search}`, {
        headers: authorization(token),
      });
      if (!response.ok) throw await apiError(response);
      return tripCardSchema.array().parse(await response.json());
    },

    async getTrip(
      token: string,
      slug: string,
      locale?: SupportedLocale,
    ): Promise<TripDetail> {
      const search = new URLSearchParams();
      if (locale) search.set("locale", locale);
      const response = await fetcher(
        `${baseUrl}/trips/${encodeURIComponent(slug)}?${search}`,
        { headers: authorization(token) },
      );
      if (!response.ok) throw await apiError(response);
      return tripDetailSchema.parse(await response.json());
    },

    async getTripChat(token: string, slug: string): Promise<TripChat> {
      const response = await fetcher(
        `${baseUrl}/trips/${encodeURIComponent(slug)}/messages`,
        { headers: authorization(token) },
      );
      if (!response.ok) throw await apiError(response);
      return tripChatSchema.parse(await response.json());
    },

    async sendTripMessage(
      token: string,
      slug: string,
      content: string,
    ): Promise<ChatMessage> {
      const body = sendChatMessageSchema.parse({ content });
      const response = await fetcher(
        `${baseUrl}/trips/${encodeURIComponent(slug)}/messages`,
        {
          method: "POST",
          headers: {
            ...authorization(token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) throw await apiError(response);
      return chatMessageSchema.parse(await response.json());
    },

    async subscribeTripChat(
      token: string,
      slug: string,
      onMessages: () => void,
      signal: AbortSignal,
    ) {
      const response = await fetcher(
        `${baseUrl}/trips/${encodeURIComponent(slug)}/messages/stream`,
        { headers: authorization(token), signal },
      );
      if (!response.ok) throw await apiError(response);
      if (!response.body)
        throw new Error("El chat en tiempo real no está disponible.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!signal.aborted) {
        const { done, value } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        events.forEach((event) => {
          if (event.split("\n").includes("event: messages")) onMessages();
        });
      }
    },

    async joinTrip(token: string, slug: string) {
      const response = await fetcher(
        `${baseUrl}/trips/${encodeURIComponent(slug)}/join`,
        { method: "POST", headers: authorization(token) },
      );
      if (!response.ok) throw await apiError(response);
      return tripJoinResultSchema.parse(await response.json());
    },

    async reviewTripJoinRequest(
      token: string,
      slug: string,
      requestId: string,
      input: TripJoinReview,
    ) {
      const body = tripJoinReviewSchema.parse(input);
      const response = await fetcher(
        `${baseUrl}/trips/${encodeURIComponent(slug)}/requests/${encodeURIComponent(requestId)}`,
        {
          method: "PATCH",
          headers: {
            ...authorization(token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) throw await apiError(response);
    },

    async listNotifications(token: string): Promise<NotificationCenter> {
      const response = await fetcher(`${baseUrl}/notifications`, {
        headers: authorization(token),
      });
      if (!response.ok) throw await apiError(response);
      return notificationCenterSchema.parse(await response.json());
    },

    async markNotificationRead(
      token: string,
      input: { notificationId: string } | { all: true },
    ) {
      const response = await fetcher(`${baseUrl}/notifications`, {
        method: "PATCH",
        headers: {
          ...authorization(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw await apiError(response);
    },

    async subscribeNotifications(
      token: string,
      onNotifications: () => void,
      signal: AbortSignal,
    ) {
      const response = await fetcher(`${baseUrl}/notifications/stream`, {
        headers: authorization(token),
        signal,
      });
      if (!response.ok) throw await apiError(response);
      if (!response.body)
        throw new Error(
          "Las notificaciones en tiempo real no están disponibles.",
        );
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!signal.aborted) {
        const { done, value } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        events.forEach((event) => {
          if (event.split("\n").includes("event: notifications"))
            onNotifications();
        });
      }
    },

    async registerPushToken(
      token: string,
      input: {
        token: string;
        platform: "ios" | "android";
        locale: SupportedLocale;
      },
    ) {
      const response = await fetcher(`${baseUrl}/notifications/push-token`, {
        method: "POST",
        headers: {
          ...authorization(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw await apiError(response);
    },

    async removePushToken(token: string, pushToken: string) {
      const response = await fetcher(`${baseUrl}/notifications/push-token`, {
        method: "DELETE",
        headers: {
          ...authorization(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: pushToken }),
      });
      if (!response.ok) throw await apiError(response);
    },

    async getTripNotificationPreferences(
      token: string,
      slug: string,
    ): Promise<TripNotificationPreferences> {
      const response = await fetcher(
        `${baseUrl}/trips/${encodeURIComponent(slug)}/notification-preferences`,
        { headers: authorization(token) },
      );
      if (!response.ok) throw await apiError(response);
      return tripNotificationPreferencesSchema.parse(await response.json());
    },

    async setTripNotificationPreferences(
      token: string,
      slug: string,
      input: TripNotificationPreferences,
    ): Promise<TripNotificationPreferences> {
      const response = await fetcher(
        `${baseUrl}/trips/${encodeURIComponent(slug)}/notification-preferences`,
        {
          method: "PATCH",
          headers: {
            ...authorization(token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        },
      );
      if (!response.ok) throw await apiError(response);
      return tripNotificationPreferencesSchema.parse(await response.json());
    },

    async exchangeMobileCode(code: string, verifier: string) {
      const response = await fetcher(`${baseUrl}/mobile/auth/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, verifier }),
      });
      if (!response.ok) throw await apiError(response);
      const payload = (await response.json()) as { token?: unknown };
      if (typeof payload.token !== "string") {
        throw new Error("La respuesta de acceso no es válida.");
      }
      return payload.token;
    },

    async getMobileProfile(token: string): Promise<MobileProfile> {
      const response = await fetcher(`${baseUrl}/mobile/profile`, {
        headers: authorization(token),
      });
      if (!response.ok) throw await apiError(response);
      return mobileProfileSchema.parse(await response.json());
    },

    async updateMobileProfile(token: string, formData: FormData) {
      const response = await fetcher(`${baseUrl}/mobile/profile`, {
        method: "PATCH",
        headers: authorization(token),
        body: formData,
      });
      if (!response.ok) throw await apiError(response);
      return mobileProfileSchema.parse(await response.json());
    },

    async logoutMobile(token: string) {
      await fetcher(`${baseUrl}/mobile/auth/logout`, {
        method: "POST",
        headers: authorization(token),
      });
    },
  };
}

function authorization(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function apiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    message?: unknown;
    errors?: unknown;
  } | null;
  const error = new Error(
    typeof payload?.message === "string"
      ? payload.message
      : `La solicitud ha fallado (${response.status}).`,
  );
  return Object.assign(error, {
    status: response.status,
    errors: payload?.errors,
  });
}
