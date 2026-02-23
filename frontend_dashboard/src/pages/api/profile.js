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

    // Fetch user-specific profile data
    const doc = await adminDb
      .collection("users_data")
      .doc(user_email)
      .collection("processed_profile")
      .doc("summary")
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.status(200).json(doc.data());
  } catch (err) {
    console.error("Profile API error:", err);
    res.status(500).json({ error: err.message });
  }
}