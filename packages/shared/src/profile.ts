import { z } from "zod";

const usernamePattern = /^[a-z0-9_]+$/;
const instagramUsernamePattern = /^[a-zA-Z0-9._]+$/;
const reservedUsernames = new Set([
  "admin",
  "administrador",
  "api",
  "perfil",
  "soporte",
  "viajes",
  "viajeroshub",
]);

export const usernameSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^@/, "").toLowerCase())
  .pipe(
    z
      .string()
      .min(3, "El nombre de usuario debe tener al menos 3 caracteres.")
      .max(24, "El nombre de usuario no puede superar los 24 caracteres.")
      .refine((value) => usernamePattern.test(value), {
        message: "Usa solo letras minúsculas, números y guiones bajos.",
      })
      .refine((value) => !reservedUsernames.has(value), {
        message: "Ese nombre de usuario está reservado.",
      }),
  );

export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";

export function normalizeInstagramUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const possibleUsername = trimmedValue.replace(/^@/, "");

  if (instagramUsernamePattern.test(possibleUsername)) {
    return `https://www.instagram.com/${possibleUsername}/`;
  }

  let url: URL;

  try {
    url = new URL(trimmedValue);
  } catch {
    throw new Error("Introduce un usuario o enlace válido de Instagram.");
  }

  const hostname = url.hostname.toLowerCase();
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (
    url.protocol !== "https:" ||
    !["instagram.com", "www.instagram.com"].includes(hostname) ||
    pathParts.length !== 1 ||
    !instagramUsernamePattern.test(pathParts[0] ?? "")
  ) {
    throw new Error("Introduce un usuario o enlace válido de Instagram.");
  }

  return `https://www.instagram.com/${pathParts[0]}/`;
}

const instagramSchema = z
  .string()
  .max(255)
  .transform((value, context) => {
    try {
      return normalizeInstagramUrl(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message:
          error instanceof Error
            ? error.message
            : "Introduce un usuario o enlace válido de Instagram.",
      });
      return z.NEVER;
    }
  });

export const profileInputSchema = z.object({
  username: usernameSchema,
  instagram: instagramSchema,
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

export const mobileProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string().email(),
  image: z.string().nullable(),
  username: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  profileComplete: z.boolean(),
});

export type MobileProfile = z.infer<typeof mobileProfileSchema>;
