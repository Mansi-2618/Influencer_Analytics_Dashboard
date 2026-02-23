import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminDb } from "../../../lib/firestoreAdmin";

export const authOptions = {
  providers: [
    // 🔹 GOOGLE LOGIN
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // 🔹 EMAIL + PASSWORD LOGIN
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.name || !credentials?.password) {
          throw new Error("Email, name, or password missing");
        }

        if (credentials.password.length < 4) {
          throw new Error("Invalid credentials");
        }

        return {
          id: credentials.email.toLowerCase(),
          email: credentials.email.toLowerCase(),
          name: credentials.name,
        };
      },
    }),
  ],

  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: process.env.NODE_ENV === "development" 
      ? 60 * 60 * 1  // 1 hours in dev
      : 30 * 24 * 60 * 60, // 30 days in production
  },

  callbacks: {
    // 🔹 CREATE / UPDATE USER IN FIRESTORE
    async signIn({ user, account }) {
      try {
        const email = user.email.toLowerCase();
        const userRef = adminDb.collection("users").doc(email);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
          await userRef.set({
            email,
            name: user.name || "",
            image: user.image || "",
            provider: account.provider,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            dashboard_access: false,
          });
        } else {
          const userData = userSnap.data();
          await userRef.update({
            last_login: new Date().toISOString(),
            ...(user.name && !userData.name ? { name: user.name } : {}),
          });
        }

        return true;
      } catch (err) {
        console.error("SignIn error:", err);
        return false;
      }
    },

    // 🔹 JWT: STORE TOKENS
    async jwt({ token, user, account }) {
      // First login
      if (account && user) {
        token.email = user.email;
        token.name = user.name;
        token.sub = user.id || user.email;

        // USER ACCESS TOKEN
        if (account.provider === "google") {
          token.useraccess_token = account.access_token;
        }

        if (account.provider === "credentials") {
          token.useraccess_token = Buffer.from(user.email).toString("base64");
        }
      }

      // 🔹 FETCH PAGE ACCESS TOKEN FROM FIRESTORE (if exists)
      if (token.email) {
        try {
          const userSnap = await adminDb
            .collection("users")
            .doc(token.email)
            .get();

          if (userSnap.exists) {
            const data = userSnap.data();
            token.pageaccess_token = data?.pageaccess_token || null;
            
            if (!token.name && data?.name) {
              token.name = data.name;
            }

            if (data?.instagram_credentials) {
              token.has_instagram_credentials = true;
            }
          }
        } catch (err) {
          console.error("JWT Firestore fetch error:", err);
        }
      }

      return token;
    },

    // 🔹 SESSION: EXPOSE TOKENS
    async session({ session, token }) {
      session.user.email = token.email;
      session.user.name = token.name || "User";
      session.user.id = token.email;

      // IMPORTANT
      session.useraccess_token = token.useraccess_token || null;
      session.pageaccess_token = token.pageaccess_token || null;
      session.has_instagram_credentials = token.has_instagram_credentials || false;

      return session;
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/credentials`;
    },
  },

  pages: {
    signIn: "/",
    error: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};

export default NextAuth(authOptions);
