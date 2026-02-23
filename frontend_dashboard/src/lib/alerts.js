export function generateAlerts({ profile, media, comments }) {
  const alerts = [];

  if (!profile) return alerts;

  const {
    followers = 0,
    reach = 0,
    ghost_score = 0,
    traffic_velocity = 0,
  } = profile;

  // ---- Ghost followers ----
  if (ghost_score > 20) {
    alerts.push({
      level: "critical",
      message: "Very high ghost follower ratio detected.",
    });
  } else if (ghost_score > 15) {
    alerts.push({
      level: "warning",
      message: "High ghost follower ratio detected.",
    });
  }

  // ---- Reach vs followers ----
  if (followers > 0 && reach / followers < 0.08) {
    alerts.push({
      level: "warning",
      message: "Reach is very low compared to follower base.",
    });
  }

  // ---- Traffic velocity ----
  if (traffic_velocity < 1) {
    alerts.push({
      level: "warning",
      message: "Poor bio link conversion detected.",
    });
  }

  // ---- Content virality ----
  if (media?.length) {
    const avgVPS =
      media.reduce((sum, m) => sum + (m.viral_potential_score || 0), 0) /
      media.length;

    if (avgVPS < 2) {
      alerts.push({
        level: "warning",
        message: "Overall content virality is low.",
      });
    }
  }

  // ---- Sentiment ----
  if (comments?.length && comments[0]?.sentiment !== undefined) {
    const avgSentiment =
      comments.reduce((sum, c) => sum + (c.sentiment || 0), 0) /
      comments.length;

    if (avgSentiment < 0) {
      alerts.push({
        level: "warning",
        message: "Negative audience sentiment detected.",
      });
    }
  }

  // ---- Healthy fallback ----
  if (!alerts.length) {
    alerts.push({
      level: "success",
      message: "All metrics look healthy.",
    });
  }

  return alerts;
}
