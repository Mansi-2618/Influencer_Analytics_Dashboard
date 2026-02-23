import { adminDb } from "@/lib/firestoreAdmin"; 

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { user_email } = req.query;

    if (!user_email) {
      return res.status(400).json({ error: "user_email is required" });
    }

    const userDoc = await adminDb
      .collection("user_pipeline_status")
      .doc(user_email)
      .get();

    if (!userDoc.exists) {
      return res.status(200).json({
        stage: "idle",
        progress: 0,
        progress_percentage: 0,
        message: "Ready to start",
        status: "idle"
      });
    }

    const data = userDoc.data()?.pipeline_status || {};
    const stage = data.stage || "idle";
    const progress_percentage = data.progress_percentage || data.progress || 0;
    const message = data.message || "Processing...";
    
    let status = "running";
    if (stage === "completed") {
      status = "completed";
    } else if (data.ingest_status === "failed" || stage === "failed") {
      status = "failed";
    }

    return res.status(200).json({
      stage,
      progress: progress_percentage,
      progress_percentage,
      message,
      status,
      raw_data: data // for debugging
    });

  } catch (error) {
    console.error("PIPELINE STATUS ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch pipeline status",
      stage: "error",
      progress: 0,
      progress_percentage: 0,
      status: "error"
    });
  }
}