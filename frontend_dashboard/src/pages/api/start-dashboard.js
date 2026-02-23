import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { adminDb } from "../../lib/firestoreAdmin";
import { decryptToken } from "../../lib/encryption";

const INGEST_CLOUD_URL = process.env.INGEST_CLOUD_URL;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }


  try {
    if (!INGEST_CLOUD_URL) {
      return res.status(500).json({
        error: "INGEST_CLOUD_URL is not defined",
      });
    }

    // 🔹 Get session
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user_email = session.user.email;
    // 🔹 Get tokens from Firestore (SOURCE OF TRUTH)
const email = session.user.email.toLowerCase();
const userRef = adminDb.collection("users").doc(email);
const userSnap = await userRef.get();

if (!userSnap.exists) {
  return res.status(400).json({ error: "User not found" });
}

const creds = userSnap.data()?.instagram_credentials;

if (!creds?.useraccess_token || !creds?.pageaccess_token) {
      console.error("Instagram credentials not found in Firestore");
      return res.status(400).json({
        error: "Instagram credentials not connected",
      });
    }

    // 🔹 DECRYPT TOKENS BEFORE USING THEM
    let useraccess_token, pageaccess_token;
    
    try {
      useraccess_token = decryptToken(creds.useraccess_token);
      pageaccess_token = decryptToken(creds.pageaccess_token);
      
      console.log("Tokens decrypted successfully");
    } catch (decryptError) {
      console.error("Token decryption failed:", decryptError);
      return res.status(500).json({
        error: "Failed to decrypt Instagram credentials",
        details: decryptError.message,
      });
    }

    // 🔹 Validate decrypted tokens
    if (!useraccess_token || !pageaccess_token) {
      console.error("Decrypted tokens are empty");
      return res.status(400).json({
        error: "Invalid Instagram tokens after decryption",
      });
    }

    console.log("Starting ingest pipeline for:", user_email);

    // 🔹 Call INGEST Cloud Function
    const response = await fetch(INGEST_CLOUD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_email,
        useraccess_token,
        pageaccess_token,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ingest error:", errorText);
      return res.status(500).json({
        error: "Failed to start ingest pipeline",
        ingest_error: errorText,
      });
    }
    const result = await response.json();
    console.log("Pipeline started successfully:", result);

    return res.status(200).json({
      started: true,
      message: "Pipeline started successfully",
      result,
    });

  } catch (error) {
    console.error("START DASHBOARD ERROR:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
