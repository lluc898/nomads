const fallbackRedirect = "/mis-viajes";
const redirectBase = "https://viajeroshub.local";

export function getSafeCallbackUrl(value?: string) {
  if (!value?.startsWith("/")) {
    return fallbackRedirect;
  }

  try {
    const url = new URL(value, redirectBase);

    if (url.origin !== redirectBase) {
      return fallbackRedirect;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallbackRedirect;
  }
}

export function getProfileSetupUrl(callbackUrl: string) {
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl);
  return `/perfil?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;
}
