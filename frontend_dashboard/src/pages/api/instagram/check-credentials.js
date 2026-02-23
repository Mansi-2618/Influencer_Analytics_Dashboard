import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { adminDb } from "../../../lib/firestoreAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || !session.user.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // ✅ ALWAYS USE EMAIL AS DOC ID
    const email = session.user.email.toLowerCase();

    const userRef = adminDb.collection("users").doc(email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(200).json({
        hasCredentials: false,
        username: null,
        userId: null,
        pageId: null,
      });
    }

    const userData = userDoc.data();
    const hasCredentials = !!userData?.instagram_credentials?.access_token;

    return res.status(200).json({
      hasCredentials,
      username: userData?.instagram_credentials?.username || null,
      userId: userData?.instagram_credentials?.user_id || null,
      pageId: userData?.instagram_credentials?.page_id || null,
    });
  } catch (error) {
    console.error("Error checking credentials:", error);
    return res.status(500).json({
      error: "Failed to check credentials",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
