import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { db } from "./database";

/**
 * Accounts that should automatically become `admin` on sign-up, by email
 * (comma-separated in .env). Anyone else who registers gets the default
 * `customer` role. Promote additional accounts later with a direct DB update.
 */
const ADMIN_EMAILS = (process.env.MARKETPLACE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.WEBSITE_URL,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: (request) => {
    const origin = request?.headers.get("origin");
    return origin ? [origin] : ["*"];
  },
  user: {
    additionalFields: {
      /** `customer` | `admin` — set server-side only, never from client input. */
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
    },
  },
  plugins: [bearer()],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role = ADMIN_EMAILS.includes(user.email.toLowerCase()) ? "admin" : "customer";
          return { data: { ...user, role } };
        },
      },
    },
  },
});
