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

    // Fetch user-specific media data
    const snap = await adminDb
      .collection("users_data")
      .doc(user_email)
      .collection("processed_media")
      .get();

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    res.status(200).json(data);
  } catch (err) {
    console.error("Media API error:", err);
    res.status(500).json({ error: err.message });
  }
}