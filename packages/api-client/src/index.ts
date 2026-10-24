import {
  isSupportedLocale,
  mobileProfileSchema,
  type SupportedLocale,
  travelLocationSchema,
  tripCardSchema,
  type MobileProfile,
  type TravelLocation,
  type TripCard,
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

    async listTrips(): Promise<TripCard[]> {
      const response = await fetcher(`${baseUrl}/trips`);
      if (!response.ok) {
        throw new Error(
          `No se pudieron cargar los viajes (${response.status})`,
        );
      }
      return tripCardSchema.array().parse(await response.json());
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
