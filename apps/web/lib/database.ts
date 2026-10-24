import "server-only";

import { createDatabase, type Database } from "@viajeroshub/database";

let database: Database | undefined;

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  database ??= createDatabase(databaseUrl);
  return database;
}
