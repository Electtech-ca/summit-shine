import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Under a base path (the ElectTech VPS, deploy/vps) the site shares www.electtech.ca with the
// ElectTech website, whose own Auth.js login uses the default cookie names. Giving these cookies
// their own names, scoped to the base path, keeps the two sessions from overwriting each other.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const cookieOptions = { httpOnly: true, sameSite: "lax" as const, path: basePath, secure: true };
const cookies = basePath
  ? {
      sessionToken: { name: "__Secure-summit-shine.session-token", options: cookieOptions },
      callbackUrl: { name: "__Secure-summit-shine.callback-url", options: cookieOptions },
      csrfToken: { name: "__Secure-summit-shine.csrf-token", options: cookieOptions },
    }
  : undefined;

// Edge-safe subset of the NextAuth config — no Prisma adapter or bcrypt here,
// since this file is imported by middleware.ts, which runs in the Edge
// runtime. The Credentials provider (which needs both) is added on top of
// this in auth.ts, which only runs in the Node.js runtime.
export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  cookies,
  session: { strategy: "jwt" },
  pages: {
    // Auth.js redirects here itself (e.g. after an error), so it needs the base path spelled out
    signIn: `${basePath}/login`,
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CUSTOMER" | "STAFF" | "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
