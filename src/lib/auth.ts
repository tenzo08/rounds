import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt",
    // A student is signed out after 10 minutes of no activity — every page
    // load within that window pushes the expiry back out (updateAge), so
    // active use never gets interrupted, but a genuinely idle tab expires.
    maxAge: 10 * 60,
    updateAge: 60,
  },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.sub || !profile.email) {
        console.error(
          "Google sign-in denied — profile missing sub/email:",
          JSON.stringify(profile),
        );
        return false;
      }

      // Only email is kept in sync from Google on every sign-in. displayName
      // and avatarUrl are seeded from Google once, at account creation, and
      // never overwritten again — a student may have customized them since.
      await prisma.user.upsert({
        where: { googleSub: profile.sub },
        update: {
          email: profile.email,
        },
        create: {
          googleSub: profile.sub,
          email: profile.email,
          displayName: profile.name ?? profile.email,
          avatarUrl: typeof profile.picture === "string" ? profile.picture : null,
        },
      });

      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.sub) {
        const user = await prisma.user.findUnique({
          where: { googleSub: profile.sub },
        });
        if (user) {
          token.userId = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});
