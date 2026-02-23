import json
import base64
from collections import defaultdict
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from datetime import datetime, timezone
from google.cloud import firestore

# -----------------------------
# CONFIG
# -----------------------------
PROJECT_ID = "research-playground-464015"
DATABASE_ID = "instagram-influencer-database"

# -----------------------------
# FIRESTORE CLIENT
# -----------------------------
def get_firestore_client():
    return firestore.Client(
        project=PROJECT_ID,
        database=DATABASE_ID
    )

analyzer = SentimentIntensityAnalyzer()

# -----------------------------
# SENTIMENT LOGIC (UNCHANGED)
# -----------------------------
NEGATIVE_KEYWORDS = {
    "nonsense": -0.6,
    "non sense": -0.6,
    "worst": -0.7,
    "bad": -0.4,
    "fake": -0.7,
    "hate": -0.6,
    "angry": -0.5,
    "stop": -0.4,
    "dont": -0.3,
    "don't": -0.3,
    "terrible": -0.7,
    "poor": -0.4,
    "useless": -0.6
}

POSITIVE_KEYWORDS = {
    "love": 0.6,
    "amazing": 0.7,
    "awesome": 0.6,
    "great": 0.5,
    "excellent": 0.8,
    "nice": 0.4
}

NEGATIVE_EMOJIS = ["😡", "🤬", "👎", "😠", "💩", "😤"]
POSITIVE_EMOJIS = ["😍", "❤️", "🔥", "👏", "😊", "😁"]
NEGATION_WORDS = ["don't", "dont", "not", "never", "no"]

def analyze_sentiment(text: str):
    if not text:
        return 0.0, "neutral"

    text_lower = text.lower()
    score = 0.0

    for word, penalty in NEGATIVE_KEYWORDS.items():
        if word in text_lower:
            score += penalty

    for word, boost in POSITIVE_KEYWORDS.items():
        if word in text_lower:
            score += boost

    if any(e in text for e in NEGATIVE_EMOJIS):
        score -= 0.5
    if any(e in text for e in POSITIVE_EMOJIS):
        score += 0.4

    score += analyzer.polarity_scores(text)["compound"]

    if any(n in text_lower for n in NEGATION_WORDS):
        score *= 0.8

    score = max(min(score, 1.0), -1.0)

    if score >= 0.4:
        label = "positive"
    elif score <= -0.3:
        label = "negative"
    else:
        label = "neutral"

    return round(score, 3), label


# -----------------------------
# DATA FETCH (USER SCOPED)
# -----------------------------
def fetch_processed_comments(user_ref):
    docs = user_ref.collection("processed_comments").stream()
    comments = []

    for d in docs:
        data = d.to_dict()
        data["comment_id"] = d.id
        comments.append(data)

    return comments


def fetch_processed_media(user_ref):
    docs = user_ref.collection("processed_media").stream()
    media_map = {}

    for d in docs:
        media_map[d.id] = d.to_dict()

    return media_map


def group_comment_sentiments_by_media(user_ref):
    docs = user_ref.collection("processed_comments_sentiment").stream()
    grouped = defaultdict(list)

    for d in docs:
        c = d.to_dict()
        grouped[c["media_id"]].append(c)

    return grouped


# -----------------------------
# PROCESSING
# -----------------------------
def process_comments_sentiment(comments):
    processed = []

    for c in comments:
        text = c.get("text")
        if not text:
            continue

        score, label = analyze_sentiment(text)

        processed.append({
            "comment_id": c["comment_id"],
            "media_id": c.get("media_id"),
            "username": c.get("username"),
            "text": text,
            "sentiment_score": score,
            "sentiment_label": label,
            "created_at": c.get("timestamp"),
            "processed_at": datetime.now(timezone.utc).isoformat()
        })

    return processed


def compute_media_sentiment(media_map, media_comments_map):
    results = []

    for media_id, media in media_map.items():
        comments = media_comments_map.get(media_id, [])
        total = len(comments)

        if total == 0:
            avg_score = 0.0
            label = "neutral"
        else:
            avg_score = sum(c["sentiment_score"] for c in comments) / total
            label = "positive" if avg_score >= 0.25 else "negative" if avg_score <= -0.25 else "neutral"

        results.append({
            "media_id": media_id,
            "media_type": media.get("media_type"),
            "likes": media.get("likes", 0),
            "comments": media.get("comments", 0),
            "viral_potential_score": media.get("viral_potential_score"),
            "avg_sentiment_score": round(avg_score, 3),
            "sentiment_label": label,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

    return results


# -----------------------------
# STORE (USER SCOPED)
# -----------------------------
def store_sentiments(user_ref, processed_comments):
    for i in range(0, len(processed_comments), 400):
        batch = user_ref._client.batch()
        for c in processed_comments[i:i+400]:
            ref = user_ref.collection("processed_comments_sentiment").document(c["comment_id"])
            batch.set(ref, c)
        batch.commit()


def store_media_sentiment(user_ref, media_results):
    for i in range(0, len(media_results), 400):
        batch = user_ref._client.batch()
        for m in media_results[i:i+400]:
            ref = user_ref.collection("processed_media_sentiment").document(m["media_id"])
            batch.set(ref, m)
        batch.commit()


def summarize_sentiment(processed_comments):
    total = len(processed_comments)
    if total == 0:
        return {}

    positive = sum(1 for c in processed_comments if c["sentiment_label"] == "positive")
    negative = sum(1 for c in processed_comments if c["sentiment_label"] == "negative")
    neutral = total - positive - negative
    avg_score = sum(c["sentiment_score"] for c in processed_comments) / total

    return {
        "total_comments": total,
        "positive_percent": round((positive / total) * 100, 1),
        "negative_percent": round((negative / total) * 100, 1),
        "neutral_percent": round((neutral / total) * 100, 1),
        "average_sentiment_score": round(avg_score, 3),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


# -----------------------------
# PUB/SUB ENTRY POINT
# -----------------------------
def sentiment_analysis_pipeline(event, context):
    payload = json.loads(
        base64.b64decode(event["data"]).decode("utf-8")
    )

    user_email = payload.get("user_email")
    if not user_email:
        raise ValueError("user_email missing in Pub/Sub payload")

    db = get_firestore_client()
    user_ref = db.collection("users_data").document(user_email)

    # -------- PIPELINE STATUS → SENTIMENT START --------
    db.collection("user_pipeline_status").document(user_email).set({
        "pipeline_status": {
            "stage": "sentiment",
            "progress": 75,
            "progress_percentage": 75,
            "message": "Analyzing audience sentiment...",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }, merge=True)

    # -------- COMMENTS SENTIMENT --------
    comments = fetch_processed_comments(user_ref)
    processed = process_comments_sentiment(comments)
    store_sentiments(user_ref, processed)

    # Update progress
    db.collection("user_pipeline_status").document(user_email).set({
        "pipeline_status": {
            "stage": "sentiment",
            "progress": 85,
            "progress_percentage": 85,
            "message": "Computing sentiment summary...",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }, merge=True)

    # -------- SUMMARY --------
    summary = summarize_sentiment(processed)
    if summary:
        user_ref.collection("processed_comments_sentiment_summary") \
            .document("current") \
            .set(summary)
        
    # Update progress
    db.collection("user_pipeline_status").document(user_email).set({
        "pipeline_status": {
            "stage": "sentiment",
            "progress": 95,
            "progress_percentage": 95,
            "message": "Finalizing sentiment analysis...",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }, merge=True)
    

    # -------- MEDIA SENTIMENT --------
    media_map = fetch_processed_media(user_ref)
    media_comments_map = group_comment_sentiments_by_media(user_ref)
    store_media_sentiment(
        user_ref,
        compute_media_sentiment(media_map, media_comments_map)
    )

    # -------- PIPELINE STATUS → COMPLETED --------
    db.collection("user_pipeline_status").document(user_email).set({
        "pipeline_status": {
            "stage": "completed",
            "ingest_status": "completed",
            "progress": 100,
            "progress_percentage": 100,
            "message": "Dashboard ready!",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }, merge=True)

    print(f"Sentiment pipeline completed for {user_email}")
