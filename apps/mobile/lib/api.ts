import { createApiClient } from "@viajeroshub/api-client";
import { fetch as expoFetch } from "expo/fetch";

import { API_URL } from "@/lib/config";

export const api = createApiClient({
  baseUrl: API_URL,
  fetcher: expoFetch as typeof fetch,
});
