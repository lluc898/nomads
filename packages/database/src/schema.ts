import {
  date,
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
