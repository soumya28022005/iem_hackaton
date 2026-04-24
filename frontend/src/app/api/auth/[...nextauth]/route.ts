import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "nexusops-dev-fallback-secret",
  providers: [
    CredentialsProvider({
      id: "firebase",
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        try {
          const res = await fetch(`${API_BASE}/api/v1/auth/firebase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: credentials.idToken }),
          });

          if (!res.ok) {
            const errorBody = await res.json().catch(() => null);
            console.error("Firebase backend auth failed:", {
              status: res.status,
              error: errorBody?.error || res.statusText,
            });
            return null;
          }

          const data = await res.json();
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            image: data.user.avatar_url,
            accessToken: data.tokens.access_token,
            refreshToken: data.tokens.refresh_token,
            provider: data.user.provider,
          };
        } catch (error) {
          console.error("Firebase auth error:", error);
          return null;
        }
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          // Return user + tokens so we can store them in the JWT
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            image: data.user.avatar_url,
            accessToken: data.tokens.access_token,
            refreshToken: data.tokens.refresh_token,
            provider: data.user.provider,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            httpOptions: { timeout: 15000 },
          }),
        ]
      : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            httpOptions: { timeout: 15000 },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For GitHub OAuth: exchange the token with our backend
      if (account?.provider === "github" && account.access_token) {
        try {
          const res = await fetch(
            `${API_BASE}/api/v1/auth/github/callback?code=${account.access_token}`,
          );
          if (res.ok) {
            const data = await res.json();
            const u = user as unknown as Record<string, unknown>;
            u.accessToken = data.tokens.access_token;
            u.refreshToken = data.tokens.refresh_token;
            u.backendId = data.user.id;
          }
        } catch (e) {
          console.error("GitHub backend sync error:", e);
        }
      }

      // For Google OAuth: sync with backend using token
      if (account?.provider === "google" && account.access_token) {
        try {
          const res = await fetch(
            `${API_BASE}/api/v1/auth/google/callback?token=${account.access_token}`,
          );
          if (res.ok) {
            const data = await res.json();
            const u = user as unknown as Record<string, unknown>;
            u.accessToken = data.tokens.access_token;
            u.refreshToken = data.tokens.refresh_token;
            u.backendId = data.user.id;
          }
        } catch (e) {
          console.error("Google backend sync error:", e);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // On initial sign in, persist backend tokens into the JWT
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.accessToken = u.accessToken as string | undefined;
        token.refreshToken = u.refreshToken as string | undefined;
        token.backendId = (u.backendId || u.id) as string | undefined;
        token.provider = u.provider as string | undefined;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose backend tokens and user ID in the session
      const s = session as unknown as Record<string, unknown>;
      s.accessToken = token.accessToken;
      s.refreshToken = token.refreshToken;
      if (session.user) {
        const su = session.user as unknown as Record<string, unknown>;
        su.id = token.backendId || token.sub;
        su.provider = token.provider;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
