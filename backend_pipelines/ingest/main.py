from concurrent.futures import process
import os
import base64
import json
import requests
import time
from datetime import datetime, timezone
from google.cloud import pubsub_v1, secretmanager, firestore
import hashlib
from Crypto.Cipher import AES

# ==============================
# GCP SETUP
# ==============================
PROJECT_ID = "research-playground-464015"
TOPIC_ID = "influencer-dashboard-topic"

publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)

db = firestore.Client(
    project=PROJECT_ID,
    database="instagram-influencer-database"
)
sm_client = secretmanager.SecretManagerServiceClient()
publisher = pubsub_v1.PublisherClient()


# ==============================
# UTILITY FUNCTIONS
# ==============================
def get_secret(secret_name):
    """Get secret from Secret Manager"""
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{secret_name}/versions/latest"
    return client.access_secret_version(name=name).payload.data.decode("utf-8")

ENCRYPTION_SECRET = get_secret("ENCRYPTION_KEY")

def decrypt_token(encrypted_text, secret_key):
    """
    Decrypt token encrypted using Node.js crypto (aes-256-cbc)
    Format: iv_base64:encrypted_base64
    """

    key = hashlib.sha256(secret_key.encode()).digest()

    iv_base64, encrypted = encrypted_text.split(":")
    iv = base64.b64decode(iv_base64)
    encrypted_bytes = base64.b64decode(encrypted)

    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = cipher.decrypt(encrypted_bytes)

    # remove PKCS7 padding
    pad_len = decrypted[-1]
    return decrypted[:-pad_len].decode("utf-8")

def get_user_credentials(user_email):
    """
    Fetch user credentials from Firestore based on email
    """
    try:
        print(f"Fetching credentials for: {user_email}")

        user_ref = db.collection('users').document(user_email)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise ValueError(f"No user found with email: {user_email}")

        user_data = user_doc.to_dict()

        if 'instagram_credentials' not in user_data:
            raise ValueError("User has no Instagram credentials")

        creds = user_data['instagram_credentials']

        encrypted_user_token = creds.get('useraccess_token')
        encrypted_page_token = creds.get('pageaccess_token')

        if not encrypted_user_token or not encrypted_page_token:
            raise ValueError("Missing Instagram access tokens")

        # DECRYPT TOKENS
        user_token = decrypt_token(encrypted_user_token, ENCRYPTION_SECRET)
        page_token = decrypt_token(encrypted_page_token, ENCRYPTION_SECRET)

        if not user_token or not page_token:
            raise ValueError("Missing Instagram access tokens")

        print(f"Credentials fetched successfully for: {user_email}")

        return {
            'IG_USER_ID': creds.get('user_id'),
            'IG_ACCESS_TOKEN': user_token,      
            'FB_ACCESS_TOKEN': page_token,      
            'USERNAME': creds.get('username'),
            'USER_EMAIL': user_email,
        }

    except Exception as e:
        print(f"Error fetching credentials: {e}")
        raise


def update_pipeline_status(user_email, status_update):
    """Update pipeline status in Firestore"""
    try:
        user_ref = db.collection('user_pipeline_status').document(user_email)
        user_ref.set({
            'pipeline_status': status_update
        }, merge=True)
        print(f"Pipeline status updated for {user_email}: {status_update}")
    except Exception as e:
        print(f"Error updating pipeline status: {e}")

# ==============================
# SAME VARIABLES (NO CHANGE)
# ==============================
IG_BASIC_URL = get_secret("IG_BASIC_URL")
IG_GRAPH_URL = get_secret("IG_GRAPH_URL")

# ==============================
# API FUNCTIONS
# ==============================
def get(url, params):
    res = requests.get(url, params=params)
    return res.json()

PROFILE_METRICS = [
    "profile_views",
    "reach",
    "website_clicks",
    "accounts_engaged",
    "total_interactions"
]

def fetch_profile_insights(user_id, pageaccess_token):
    insights = {}
    for metric in PROFILE_METRICS:
        insights[metric] = get(
            f"{IG_GRAPH_URL}/{user_id}/insights",
            {
                "metric": metric,
                "period": "day",
                "metric_type": "total_value",
                "access_token": pageaccess_token
            }
        )
        time.sleep(0.2)
    return insights

def fetch_media_ids(user_id, pageaccess_token):
    return get(
        f"{IG_GRAPH_URL}/{user_id}/media",
        {
            "fields": "id,caption,media_type,media_product_type,timestamp,like_count,comments_count",
            "limit": 20,
            "access_token": pageaccess_token
        }
    ).get("data", [])

POST_METRICS = [
    "reach",
    "impressions",
    "saved",
    "comments",
    "likes",
    "reposts",
    "crossposted_views"
]

REEL_METRICS = POST_METRICS + [
    "plays",
    "ig_reels_video_view_total_time",
    "ig_reels_avg_watch_time",
    "ig_reels_aggregated_all_plays_count",
    "clips_replays_count",
    "reels_skip_rate"
]

def fetch_media_insights(media_id, is_reel, pageaccess_token):
    metrics = REEL_METRICS if is_reel else POST_METRICS
    insights = {}

    for metric in metrics:
        insights[metric] = get(
            f"{IG_GRAPH_URL}/{media_id}/insights",
            {
                "metric": metric,
                "metric_type": "total_value",
                "access_token": pageaccess_token
            }
        )
        time.sleep(0.2)

    return insights

def fetch_comments(media_id, pageaccess_token):
    return get(
        f"{IG_GRAPH_URL}/{media_id}/comments",
        {
            "fields": "id,text,timestamp,username,like_count,parent_id",
            "access_token": pageaccess_token
        }
    ).get("data", [])

# ==============================
# CLOUD FUNCTION ENTRY POINT
# ==============================
def ingest_instagram_data(request):
    """
    Cloud Function entry point
    Accepts user_email in request body
    Example: {"user_email": "user@example.com"}
    """
    try:
        # Parse request
        request_json = request.get_json(silent=True)
        
        if not request_json or 'user_email' not in request_json:
            return {
                'error': 'user_email is required in request body'
            }, 400
        
        user_email = request_json['user_email']
        
        print(f"Starting ingest for user: {user_email}")
        
        # Update status to running
        update_pipeline_status(user_email, {
            'stage': 'ingest',
            'ingest_status': 'running',
            'progress': 10,
            'progress_percentage': 10,
            'message': 'Starting data ingestion...',
            'ingest_started_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
        })
        
        # Get user-specific credentials from Firestore
        credentials = get_user_credentials(user_email)
        IG_USER_ID = credentials['IG_USER_ID']
        IG_ACCESS_TOKEN = credentials['IG_ACCESS_TOKEN']
        FB_ACCESS_TOKEN = credentials['FB_ACCESS_TOKEN']
        USERNAME = credentials['USERNAME']
        
        print(f"Processing Instagram data for: {USERNAME}")
        
        # Fetch profile
        profile = get(
            f"{IG_GRAPH_URL}/{IG_USER_ID}",
            {
                "fields": "username,followers_count,media_count",
                "access_token": FB_ACCESS_TOKEN
            }
        )
        
        # Fetch profile insights
        profile_insights = fetch_profile_insights(IG_USER_ID, FB_ACCESS_TOKEN)
        
        # Update progress
        update_pipeline_status(user_email, {
            'stage': 'ingest',
            'ingest_status': 'running',
            'progress': 30,
            'progress_percentage': 30,
            'message': 'Fetching media posts...',
            'updated_at': datetime.now(timezone.utc).isoformat(),
        })
        
        # Fetch media
        media_items = fetch_media_ids(IG_USER_ID,FB_ACCESS_TOKEN)
        enriched_media = []
        
        total_media = len(media_items)
        for idx, media in enumerate(media_items):
            media_id = media["id"]
            is_reel = media.get("media_product_type") == "REELS"
            
            media["insights"] = fetch_media_insights(media_id, is_reel, FB_ACCESS_TOKEN)
            media["comments"] = fetch_comments(media_id, FB_ACCESS_TOKEN)
            
            enriched_media.append(media)
            
            # Update progress
            progress = 30 + int((idx + 1) / total_media * 60)
            update_pipeline_status(user_email, {
                'stage': 'ingest',
                'ingest_status': 'running',
                'progress': progress,
                'progress_percentage': progress,
                'message': f'Processing media {idx + 1}/{total_media}...',
                'updated_at': datetime.now(timezone.utc).isoformat(),
            })
        
        # Prepare payload
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_email": user_email,
            "username": USERNAME,
            "profile": profile,
            "profile_insights": profile_insights,
            "media": enriched_media
        }
        
        # Publish to Pub/Sub
        message_data = json.dumps(payload).encode("utf-8")
        future = publisher.publish(topic_path, message_data)
        message_id = future.result()
        
        print(f"Published to Pub/Sub with message ID: {message_id}")
        
        # Store raw data in user's Firestore collection
        user_raw_ref = db.collection('users_data').document(user_email).collection('raw_data')
        
        # Store profile
        user_raw_ref.document('profile').set({
            **profile,
            'profile_insights': profile_insights,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        })
        
        # Store each media item
        for media in enriched_media:
            user_raw_ref.document(media['id']).set({
                **media,
                'ingested_at': datetime.now(timezone.utc).isoformat(),
            })
        
        # Update status to completed
        update_pipeline_status(user_email, {
            'stage': 'ingest',  # Still in ingest stage
            'ingest_status': 'completed',
            'progress': 100,
            'progress_percentage': 100,
            'message': 'Ingest completed! Starting processing...',
            'records_ingested': total_media,
            'ingest_completed_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
            # Clear old errors
            'error_message': None,
            'failed_at': None,
        })
        
        print(f"Ingest completed for {user_email}. Total media: {total_media}")
        
        return {
            'status': 'success',
            'user_email': user_email,
            'username': USERNAME,
            'records_ingested': total_media,
            'message_id': message_id,
        }, 200
        
    except Exception as e:
        print(f"Ingest failed: {e}")
        
        # Update status to failed
        if 'user_email' in locals():
            update_pipeline_status(user_email, {
                'stage': 'failed',
                'ingest_status': 'failed',
                'progress': 0,
                'progress_percentage': 0,
                'message': f'Ingest failed: {str(e)}',
                'error_message': str(e),
                'failed_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat(),
            })
        
        return {
            'status': 'error',
            'error': str(e)
        }, 500