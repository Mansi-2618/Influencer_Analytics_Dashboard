import { adminDb } from "@/lib/firestoreAdmin";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    // Get authenticated user
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user_email = session.user.email;

    // Fetch user-specific sentiment summary
    const docRef = adminDb
      .collection("users_data")
      .doc(user_email)
      .collection("processed_comments_sentiment_summary")
      .doc("current");

    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ 
        error: "Sentiment summary not found",
        message: "Data may still be processing"
      });
    }

    res.status(200).json(snap.data());
  } catch (err) {
    console.error("Sentiment summary API error:", err);
    res.status(500).json({ error: err.message });
  }
}