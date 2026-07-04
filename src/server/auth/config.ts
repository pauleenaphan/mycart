import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";

import { db } from "~/server/db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      isGuest?: boolean;
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  providers: [
    DiscordProvider,
    Credentials({
      id: "guest",
      name: "Guest",
      credentials: {},
      authorize: async () => {
        const id = crypto.randomUUID();
        const user = await db.user.create({
          data: {
            name: "Guest",
            email: `guest-${id}@guest.local`,
            isGuest: true,
            useGeminiPrices: false,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isGuest: user.isGuest,
        };
      },
    }),
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
    signOut: "/signout",
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id;
        token.isGuest =
          user.email?.endsWith("@guest.local") ??
          ("isGuest" in user && typeof user.isGuest === "boolean"
            ? user.isGuest
            : false);
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub!,
        isGuest: token.isGuest ?? false,
      },
    }),
  },
} satisfies NextAuthConfig;
