import base64
import json
from collections import Counter
from datetime import datetime, timezone
from google.cloud import pubsub_v1, firestore


# -------------------- CONFIG --------------------
PROJECT_ID = "research-playground-464015"
SENTIMENT_TOPIC_ID = "sentiment-analysis-topic"

# -------------------- Firestore --------------------
db = firestore.Client(database="instagram-influencer-database")

# -------------------- Pub/Sub Publisher --------------------
publisher = pubsub_v1.PublisherClient()
sentiment_topic_path = publisher.topic_path(PROJECT_ID, SENTIMENT_TOPIC_ID)

# -------------------- Helpers --------------------
    
def extract_metric_media(insights_dict, metric_name):
    try:
        return (
            insights_dict
            .get(metric_name, {})
            .get("values", [{}])[0]
            .get("value", 0)
        )
    except Exception:
        return 0


# -------------------- Profile Processing --------------------
def process_profile(user_email):
    summary_ref = db.collection("users_data").document(user_email)\
                    .collection("profile").document("summary")
    summary = summary_ref.get().to_dict()

    if not summary:
        raise ValueError(f"No profile/summary found for {user_email}")

    followers        = summary.get("followers_count", 1)
    reach            = summary.get("reach", 0)
    profile_views    = summary.get("profile_views", 0)
    website_clicks   = summary.get("website_clicks", 0)
    accounts_engaged = summary.get("accounts_engaged", 0)

    ghost_score      = max(0, ((followers - reach) / followers) * 100) if followers else 0
    traffic_velocity = (website_clicks / profile_views) * 100 if profile_views else 0
    
    return {
        # ── Basic ──────────────────────────────
        "username":           summary.get("username"),
        "followers":          followers,
        "media_count":        summary.get("media_count", 0),
        "account_type":       summary.get("account_type", "UNKNOWN"),

        # ── Insights totals ────────────────────
        "reach":              reach,
        "profile_views":      profile_views,
        "website_clicks":     website_clicks,
        "accounts_engaged":   accounts_engaged,
        "total_interactions": summary.get("total_interactions", 0),
        "content_views":      summary.get("content_views", 0),
        "views":              summary.get("views", 0),
        "shares":             summary.get("shares", 0),
        "saves":              summary.get("saves", 0),
        "replies":            summary.get("replies", 0),
        "profile_links_taps": summary.get("profile_links_taps", 0),

        # ── Computed ───────────────────────────
        "ghost_score":        round(ghost_score, 2),
        "traffic_velocity":   round(traffic_velocity, 2),
        "status":             "Healthy" if ghost_score > 10 else "Risk",

        "processed_at":       datetime.now(timezone.utc).isoformat()
    }


# -------------------- Media Processing --------------------
def process_media(raw):
    media_metrics = []

    for media in raw.get("media", []):
        insights = media.get("insights", {})

        reach    = insights.get("reach", 0) or 1
        saves    = insights.get("saved", 0)
        likes    = insights.get("likes", 0) or media.get("like_count", 0)
        comments = insights.get("comments", 0) or media.get("comments_count", 0)
        views    = insights.get("views", 0)
        reposts  = insights.get("reposts", 0)
        impressions       = insights.get("impressions", 0)
        total_interactions = insights.get("total_interactions", 0)

        # Reel specific
        plays        = insights.get("plays", 0)
        replays      = insights.get("clips_replays_count", 0)
        skip_rate    = insights.get("reels_skip_rate", 0)

        vps = ((saves * 3) + (comments * 2) + likes) / reach if reach else None

        hook_efficiency = (1 - skip_rate) if skip_rate else None
        rewatch_ratio   = (replays / plays) if plays else None

        media_metrics.append({
            "media_id":           media["id"],
            "media_type":         media.get("media_product_type", "POST"),
            "timestamp":          media.get("timestamp"),
            "reach":              reach,
            "likes":              likes,
            "comments":           comments,
            "saves":              saves,
            "views":              views,
            "reposts":            reposts,
            "impressions":        impressions,
            "total_interactions": total_interactions,
            "plays":              plays,
            "clips_replays_count": replays,
            "reels_skip_rate":    skip_rate,
            "viral_potential_score": round(vps, 2) if vps is not None else None,
            "hook_efficiency":    round(hook_efficiency, 2) if hook_efficiency is not None else None,
            "rewatch_ratio":      round(rewatch_ratio, 2) if rewatch_ratio is not None else None,
            "processed_at":       datetime.now(timezone.utc).isoformat()
        })

    return media_metrics

# -------------------- Comments Processing --------------------
def process_comments(raw):
    comments_docs = []
    user_counter = Counter()

    for media in raw.get("media", []):
        for c in media.get("comments", []):
            comments_docs.append({
                "comment_id": c.get("id"),
                "media_id": media.get("id"),
                "username": c.get("username"),
                "text": c.get("text"),
                "like_count": c.get("like_count", 0),
                "timestamp": c.get("timestamp"),
                "processed_at": datetime.now(timezone.utc).isoformat()
            })

            if c.get("username"):
                user_counter[c.get("username")] += 1

    top_commenters_dict = {}
    for username, count in user_counter.most_common(10):
        top_commenters_dict[username] = count

    summary = {
        "total_comments": len(comments_docs),
        "top_commenters": top_commenters_dict, 
        "processed_at": datetime.now(timezone.utc).isoformat()
    }

    return comments_docs, summary


# -------------------- Cloud Function Entry --------------------
def insta_data_processing(event, context):
    raw = json.loads(
        base64.b64decode(event["data"]).decode("utf-8")
    )

    user_email = raw.get("user_email")
    if not user_email:
        raise ValueError("user_email missing in payload")

    # -------- PIPELINE STATUS → PROCESSING --------
    db.collection("user_pipeline_status").document(user_email).set({
        "pipeline_status": {
            "stage": "process",
            "ingest_status": "completed",  # Keep previous stage status
            "progress": 35,
            "progress_percentage": 35,
            "message": "Processing Instagram data...",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }, merge=True)

    user_ref = db.collection("users_data").document(user_email)

    # ---------------- PROFILE ----------------
    profile_summary = process_profile(user_email)
    user_ref.collection("processed_profile") \
        .document("summary") \
        .set(profile_summary)
    
    # Update progress
    db.collection("user_pipeline_status").document(user_email).set({
        "pipeline_status": {
            "stage": "process",
            "progress": 50,
            "progress_percentage": 50,
            "message": "Processing media metrics...",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }, merge=True)

    # ---------------- MEDIA ----------------
    media_metrics = process_media(raw)
    media_ref = user_ref.collection("processed_media")

    batch = db.batch()
    for media in media_metrics:
        batch.set(media_ref.document(media["media_id"]), media)
    batch.commit()

    # Update progress
    db.collection("user_pipeline_status").document(user_email).set({
        "pipeline_status": {
            "stage": "process",
            "progress": 65,
            "progress_percentage": 65,
            "message": "Processing comments...",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }, merge=True)

    # ---------------- COMMENTS ----------------
    comments, summary = process_comments(raw)
    comments_ref = user_ref.collection("processed_comments")

    batch = db.batch()
    for c in comments:
        doc_id = f'{c["media_id"]}_{c["comment_id"]}'
        batch.set(comments_ref.document(doc_id), c)
    batch.commit()

    comments_ref.document("summary").set(summary)

    # ---------------- METADATA ----------------
    user_ref.collection("metadata").document("pipeline").set({
        "last_processed_at": datetime.now(timezone.utc).isoformat(),
        "processed_media_count": len(media_metrics),
        "processed_comment_count": len(comments)
    }, merge=True)

    print(f"Publishing to Pub/Sub for sentiment analysis: {user_email}")
    
    sentiment_payload = {
        "user_email": user_email,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "trigger_source": "process_pipeline"
    }
    
    message_data = json.dumps(sentiment_payload).encode("utf-8")
    
    try:
        future = publisher.publish(sentiment_topic_path, message_data)
        message_id = future.result()
        print(f"Sentiment trigger published with message ID: {message_id}")
    except Exception as e:
        print(f"Failed to publish sentiment trigger: {e}")
        db.collection("user_pipeline_status").document(user_email).set({
            "pipeline_status": {
                "stage": "failed",
                "progress": 70,
                "progress_percentage": 70,
                "message": f"Process completed but sentiment trigger failed: {str(e)}",
                "error_message": str(e),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }, merge=True)
        return

    # -------- PIPELINE STATUS → COMPLETED --------
    db.collection("user_pipeline_status").document(user_email).set({
        "pipeline_status": {
            "stage": "process",  # Still in process stage
            "progress": 70,
            "progress_percentage": 70,
            "message": "Processing completed! Starting sentiment analysis...",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }, merge=True)

    print(f"Processing completed for {user_email}")
