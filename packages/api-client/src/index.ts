import {
  createdTripSchema,
  chatMessageSchema,
  createTripInputSchema,
  isSupportedLocale,
  mobileProfileSchema,
  publicProfileSchema,
  sendChatMessageSchema,
  type SupportedLocale,
  travelLocationSchema,
  tripCardSchema,
  tripDetailSchema,
  tripJoinResultSchema,
  tripJoinReviewSchema,
  tripChatSchema,
  type CreateTripInput,
  type ChatMessage,
  type MobileProfile,
  type PublicProfile,
  type TravelLocation,
  type TripCard,
  type TripDetail,
  type TripJoinReview,
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
