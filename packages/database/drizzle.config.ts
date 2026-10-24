import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

config({
  path: fileURLToPath(new URL("../../.env.local", import.meta.url)),
  quiet: true,
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL es obligatoria para ejecutar Drizzle Kit");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
