import { getServerSession } from "next-auth";
import { authOptions } from "./[...nextauth]";
import { adminDb } from "@/lib/firestoreAdmin";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.GCP_PROJECT_ID,
      clientEmail: process.env.GCP_CLIENT_EMAIL,
      privateKey: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = adminDb();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    instagram_userid,
    user_access_token,
    page_access_token,
  } = req.body;

  await db.collection("users").doc(session.user.email).set({
    instagram_userid,
    user_access_token,
    page_access_token,
    updated_at: new Date().toISOString(),
  });

  res.json({ success: true });
}
