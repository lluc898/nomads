import { z } from "zod";

export const locationKindSchema = z.enum(["anywhere", "country", "airport"]);

export const travelLocationSchema = z.object({
  id: z.string().min(1).max(40),
  kind: locationKindSchema,
  name: z.string().min(1).max(200),
  subtitle: z.string().max(260),
  code: z.string().max(16).nullable(),
  countryCode: z.string().length(2).nullable(),
});

export const locationSearchQuerySchema = z.object({
  q: z.string().trim().max(80).default(""),
  includeAnywhere: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export const selectedLocationIdSchema = z.union([
  z.literal("anywhere"),
  z.string().regex(/^country:[A-Z]{2}$/),
  z.string().regex(/^airport:\d+$/),
]);

export const originLocationIdSchema = z.union([
  z.string().regex(/^country:[A-Z]{2}$/),
  z.string().regex(/^airport:\d+$/),
]);

export const travelRouteSchema = z.object({
  origin: originLocationIdSchema,
  destination: selectedLocationIdSchema,
});

export function parseLocationId(
  value: z.infer<typeof selectedLocationIdSchema>,
) {
  if (value === "anywhere") return { kind: "anywhere" as const };
  const [kind, identifier] = value.split(":") as [
    "country" | "airport",
    string,
  ];
  return kind === "country"
    ? { kind, countryCode: identifier }
    : { kind, airportId: Number(identifier) };
}

export type TravelLocation = z.infer<typeof travelLocationSchema>;
