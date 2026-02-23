import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { adminDb } from "../../../lib/firestoreAdmin";
import { encryptToken } from '../../../lib/encryption';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || !session.user.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { instagram } = req.body;

    if (
      !instagram?.username ||
      !instagram?.userId ||
      !instagram?.pageId ||
      !instagram?.useraccessToken ||
      !instagram?.pageaccessToken
    ) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const email = session.user.email.toLowerCase();
    const userRef = adminDb.collection("users").doc(email);

    const encryptedUserToken = encryptToken(instagram.useraccessToken);
    const encryptedPageToken = encryptToken(instagram.pageaccessToken);

    await userRef.set(
      {
        email,
        name: session.user.name || "",
        image: session.user.image || "",
        instagram_credentials: {
          username: instagram.username,
          user_id: instagram.userId,
          page_id: instagram.pageId,

          // SAVE TOKENS (ENCRYPTION)
          useraccess_token: encryptedUserToken,
          pageaccess_token: encryptedPageToken,

          added_at: new Date().toISOString(),
          is_verified: true,
        },
        dashboard_access: true,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      message: "Credentials saved successfully",
    });
  } catch (error) {
    console.error("Error saving credentials:", error);
    return res.status(500).json({
      error: "Failed to save credentials",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
