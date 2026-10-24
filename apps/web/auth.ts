import { DrizzleAdapter } from "@auth/drizzle-adapter";
import {
  accounts,
  createDatabase,
  sessions,
  users,
  verificationTokens,
} from "@viajeroshub/database";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const databaseUrl = process.env.DATABASE_URL;
const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

const adapter = databaseUrl
  ? DrizzleAdapter(createDatabase(databaseUrl), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    })
  : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: adapter ? "database" : "jwt" },
  providers: googleConfigured ? [Google] : [],
  pages: {
    signIn: "/acceso",
    error: "/acceso",
  },
  callbacks: {
    session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id ?? token?.sub ?? "";
      }
      return session;
    },
  },
});

export const authCapabilities = {
  database: Boolean(databaseUrl),
  google: googleConfigured,
} as const;
