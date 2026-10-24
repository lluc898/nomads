import { z } from "zod";

import { originLocationIdSchema, selectedLocationIdSchema } from "./locations";

export const tripVisibilitySchema = z.enum(["public", "private"]);
export const tripStatusSchema = z.enum([
  "draft",
  "published",
  "closed",
  "archived",
]);

export const searchTripsSchema = z.object({
  origin: originLocationIdSchema.optional(),
  destination: selectedLocationIdSchema.optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  travelers: z.coerce.number().int().min(1).max(20).default(1),
});

export const tripCardSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  dateLabel: z.string().min(1),
  priceFrom: z.number().nonnegative().nullable(),
  currency: z.string().length(3),
  availablePlaces: z.number().int().nonnegative().nullable(),
  visibility: tripVisibilitySchema,
  tags: z.array(z.string()),
  creator: z.object({
    name: z.string().min(1),
    initials: z.string().min(1).max(3),
  }),
  publishedLabel: z.string().min(1),
  tone: z.enum(["sea", "sunset", "forest"]),
});

export type SearchTripsInput = z.infer<typeof searchTripsSchema>;
export type TripCard = z.infer<typeof tripCardSchema>;

export const featuredTrips: TripCard[] = [
  {
    id: "48fdfc49-3ae4-4dd6-a053-a05e37bb0692",
    slug: "mallorca-turquia-julio",
    origin: "Palma de Mallorca",
    destination: "Turquía",
    dateLabel: "12–26 jul · Fechas flexibles",
    priceFrom: 450,
    currency: "EUR",
    availablePlaces: 4,
    visibility: "public",
    tags: ["Grupo", "Vuelos + hotel"],
    creator: { name: "Carlos", initials: "CA" },
    publishedLabel: "hace 2 h",
    tone: "sunset",
  },
  {
    id: "860d88cc-b251-47f5-bc25-93694a854b4d",
    slug: "barcelona-islandia-septiembre",
    origin: "Barcelona",
    destination: "Islandia",
    dateLabel: "6–15 sep · 9 noches",
    priceFrom: 790,
    currency: "EUR",
    availablePlaces: 2,
    visibility: "private",
    tags: ["Road trip", "Naturaleza"],
    creator: { name: "Nora", initials: "NO" },
    publishedLabel: "ayer",
    tone: "forest",
  },
  {
    id: "38646f4f-f6d6-48ee-9a26-bb24821966ad",
    slug: "madrid-azores-agosto",
    origin: "Madrid",
    destination: "Azores",
    dateLabel: "Agosto · Mes flexible",
    priceFrom: 520,
    currency: "EUR",
    availablePlaces: 5,
    visibility: "public",
    tags: ["Aventura", "Flexible"],
    creator: { name: "Lucía", initials: "LU" },
    publishedLabel: "hace 3 días",
    tone: "sea",
  },
];
