import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    return res.status(200).json(session);
  } catch (error) {
    console.error('Session check error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}