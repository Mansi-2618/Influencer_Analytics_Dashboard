import { adminDb } from "@/lib/firestoreAdmin";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const snap = await adminDb
    .collection("users_data")
    .doc(session.user.email)
    .collection("profile_insights_daily")
    .doc("data")
    .get();

  if (!snap.exists) return res.status(404).json({ error: "No data" });

  return res.status(200).json(snap.data());
}