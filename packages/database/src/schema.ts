import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const tripVisibility = pgEnum("trip_visibility", ["public", "private"]);
export const tripStatus = pgEnum("trip_status", [
  "draft",
  "published",
  "closed",
  "archived",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("display_name", { length: 120 }),
  username: varchar("username", { length: 24 }).unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  instagramUrl: varchar("instagram_url", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 32 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const mobileAuthCodes = pgTable("mobile_auth_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  codeHash: varchar("code_hash", { length: 64 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  pkceChallenge: varchar("pkce_challenge", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const mobileSessions = pgTable("mobile_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 320 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (token) => [primaryKey({ columns: [token.identifier, token.token] })],
);

export const countries = pgTable("countries", {
  code: varchar("code", { length: 2 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  nameEs: varchar("name_es", { length: 120 }).notNull(),
  continentCode: varchar("continent_code", { length: 2 }).notNull(),
  keywords: text("keywords"),
  searchText: text("search_text").notNull(),
  airportCount: integer("airport_count").default(0).notNull(),
});

export const locationCatalogImports = pgTable("location_catalog_imports", {
  dataset: varchar("dataset", { length: 64 }).primaryKey(),
  checksum: varchar("checksum", { length: 64 }).notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const airports = pgTable(
  "airports",
  {
    id: integer("id").primaryKey(),
    ident: varchar("ident", { length: 16 }).notNull().unique(),
    type: varchar("type", { length: 32 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    municipality: varchar("municipality", { length: 160 }),
    countryCode: varchar("country_code", { length: 2 })
      .notNull()
      .references(() => countries.code, { onDelete: "restrict" }),
    iataCode: varchar("iata_code", { length: 3 }),
    icaoCode: varchar("icao_code", { length: 4 }),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    scheduledService: boolean("scheduled_service").default(false).notNull(),
    keywords: text("keywords"),
    searchText: text("search_text").notNull(),
    priority: integer("priority").default(0).notNull(),
  },
  (airport) => [
    index("airports_country_code_idx").on(airport.countryCode),
    index("airports_iata_code_idx").on(airport.iataCode),
  ],
);

export const geoPlaces = pgTable("geo_places", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 160 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  parentId: uuid("parent_id"),
});

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id")
    .references(() => users.id)
    .notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  originPlaceId: uuid("origin_place_id").references(() => geoPlaces.id),
  destinationPlaceId: uuid("destination_place_id").references(
    () => geoPlaces.id,
  ),
  originCountryCode: varchar("origin_country_code", { length: 2 }).references(
    () => countries.code,
  ),
  originAirportId: integer("origin_airport_id").references(() => airports.id),
  destinationCountryCode: varchar("destination_country_code", {
    length: 2,
  }).references(() => countries.code),
  destinationAirportId: integer("destination_airport_id").references(
    () => airports.id,
  ),
  destinationAnywhere: boolean("destination_anywhere").default(false).notNull(),
  departureDate: date("departure_date"),
  returnDate: date("return_date"),
  flexibleMonth: date("flexible_month"),
  visibility: tripVisibility("visibility").default("public").notNull(),
  status: tripStatus("status").default("draft").notNull(),
  maxParticipants: integer("max_participants"),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
