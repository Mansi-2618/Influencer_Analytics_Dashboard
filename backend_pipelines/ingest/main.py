import asyncio
import aiohttp
import base64
import json
import requests
import time
from datetime import datetime, timezone, timedelta
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

MAX_DAYS_BACK = 90

# ==============================
# API FUNCTIONS
# ==============================
async def async_get(session, url, params):
    async with session.get(url, params=params) as response:
        return await response.json()

# ==============================
# PROFILE METRICS
# ==============================
PROFILE_METRICS = [
    "reach",
    "accounts_engaged",
    "total_interactions",
    "profile_views",
    "website_clicks",
    "shares",
    "saves",
    "replies",
    "profile_links_taps",
    "views",
    "content_views",
]

async def fetch_single_metric_for_date(session, user_id, access_token, metric, date_str):
    """Fetch one metric for one date — async"""
    since_dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    until_dt = since_dt + timedelta(days=1)

    res = await async_get(session, f"{IG_GRAPH_URL}/{user_id}/insights", {
        "metric":       metric,
        "period":       "day",
        "metric_type":  "total_value",
        "since":        int(since_dt.timestamp()),
        "until":        int(until_dt.timestamp()),
        "access_token": access_token,
    })

    try:
        return metric, res["data"][0]["total_value"]["value"]
    except (KeyError, IndexError, TypeError):
        return metric, 0


async def fetch_all_metrics_for_date(session, user_id, access_token, date_str):
    """Fetch ALL metrics for one date — parallel"""
    tasks = [
        fetch_single_metric_for_date(session, user_id, access_token, metric, date_str)
        for metric in PROFILE_METRICS
    ]
    results = await asyncio.gather(*tasks)
    return dict(results)


async def fetch_profile_insights_date_range(user_id, access_token):
    """Loop 90 days — each day all metrics fetched in parallel"""
    today   = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start   = today - timedelta(days=MAX_DAYS_BACK)
    current = start

    daily_insights = {}
    totals = {metric: 0 for metric in PROFILE_METRICS}

    print(f"Fetching profile insights from {start.date()} to {today.date()}")

    async with aiohttp.ClientSession() as session:
        for day_offset in range(MAX_DAYS_BACK + 1):
            current  = start + timedelta(days=day_offset)
            date_str = current.strftime("%Y-%m-%d")

            day_data = await fetch_all_metrics_for_date(session, user_id, access_token, date_str)

            for metric, value in day_data.items():
                totals[metric] += value

            daily_insights[date_str] = day_data
            print(f"  {date_str}: {day_data}")

            # Small delay between days to avoid rate limit
            await asyncio.sleep(0.3)

    return {
        "daily":  daily_insights,
        "totals": totals,
    }

# ==============================
# MEDIA FUNCTIONS (async)
# ==============================
async def fetch_media_ids(session, user_id, access_token):
    res = await async_get(session, f"{IG_GRAPH_URL}/{user_id}/media", {
        "fields":       "id,caption,media_type,media_product_type,timestamp,like_count,comments_count",
        "limit":        20,
        "access_token": access_token,
    })
    return res.get("data", [])


POST_METRICS = [
    "reach", "impressions", "saved", "comments", "total_interactions",
    "likes", "reposts", "views"
]

REEL_METRICS = POST_METRICS + [
    "plays",
    "clips_replays_count",
    "reels_skip_rate",
]

async def fetch_single_media_metric(session, media_id, access_token, metric):
    """Fetch one media metric — async"""
    res = await async_get(session, f"{IG_GRAPH_URL}/{media_id}/insights", {
        "metric":       metric,
        "period":       "lifetime",
        "access_token": access_token,
    })
    try:
        return metric, res["data"][0]["values"][0]["value"]
    except (KeyError, IndexError, TypeError):
        return metric, 0


async def fetch_media_insights(session, media_id, is_reel, access_token):
    """Fetch ALL metrics for one media — parallel"""
    metrics = REEL_METRICS if is_reel else POST_METRICS
    tasks   = [
        fetch_single_media_metric(session, media_id, access_token, metric)
        for metric in metrics
    ]
    results = await asyncio.gather(*tasks)
    return dict(results)


async def fetch_comments(session, media_id, access_token):
    res = await async_get(session, f"{IG_GRAPH_URL}/{media_id}/comments", {
        "fields":       "id,text,timestamp,username,like_count,parent_id",
        "access_token": access_token,
    })
    return res.get("data", [])


async def check_account_type(session, user_id, access_token):
    """
    Instagram Graph API does not expose account_type as a profile field.
    Workaround: /{user_id}/insights endpoint is ONLY accessible for
    Business and Creator accounts. Personal accounts return error code 10.
    Returns: "BUSINESS_OR_CREATOR" or "PERSONAL"
    """
    res = await async_get(session, f"{IG_GRAPH_URL}/{user_id}/insights", {
        "metric":       "reach",
        "period":       "day",
        "metric_type":  "total_value",
        "access_token": access_token,
    })
    if "error" in res:
        return "PERSONAL"
    return "BUSINESS_OR_CREATOR"

# ==============================
# MAIN ASYNC PIPELINE
# ==============================
async def run_ingest_pipeline(user_email):
    """Full async pipeline"""

    update_pipeline_status(user_email, {
        'stage':             'ingest',
        'ingest_status':     'running',
        'progress':          10,
        'progress_percentage': 10,
        'message':           'Starting data ingestion...',
        'ingest_started_at': datetime.now(timezone.utc).isoformat(),
        'updated_at':        datetime.now(timezone.utc).isoformat(),
    })

    credentials     = get_user_credentials(user_email)
    IG_USER_ID      = credentials['IG_USER_ID']
    FB_ACCESS_TOKEN = credentials['FB_ACCESS_TOKEN']
    USERNAME        = credentials['USERNAME']

    print(f"Processing Instagram data for: {USERNAME}")

    async with aiohttp.ClientSession() as session:

        # Basic profile + account type — parallel
        profile_task      = async_get(session, f"{IG_GRAPH_URL}/{IG_USER_ID}", {
            "fields":       "username,followers_count,media_count",
            "access_token": FB_ACCESS_TOKEN,
        })
        account_type_task = check_account_type(session, IG_USER_ID, FB_ACCESS_TOKEN)

        profile, account_type = await asyncio.gather(profile_task, account_type_task)
        profile["account_type"] = account_type

    update_pipeline_status(user_email, {
        'stage':               'ingest',
        'ingest_status':       'running',
        'progress':            20,
        'progress_percentage': 20,
        'message':             'Fetching profile insights (90 day loop)...',
        'updated_at':          datetime.now(timezone.utc).isoformat(),
    })

    # 90-day async loop
    profile_insights = await fetch_profile_insights_date_range(IG_USER_ID, FB_ACCESS_TOKEN)

    update_pipeline_status(user_email, {
        'stage':               'ingest',
        'ingest_status':       'running',
        'progress':            35,
        'progress_percentage': 35,
        'message':             'Fetching media posts...',
        'updated_at':          datetime.now(timezone.utc).isoformat(),
    })

    # Media
    enriched_media = []
    async with aiohttp.ClientSession() as session:
        media_items = await fetch_media_ids(session, IG_USER_ID, FB_ACCESS_TOKEN)
        total_media = len(media_items)

        for idx, media in enumerate(media_items):
            media_id = media["id"]
            is_reel  = media.get("media_product_type") == "REELS"

            insights, comments = await asyncio.gather(
                fetch_media_insights(session, media_id, is_reel, FB_ACCESS_TOKEN),
                fetch_comments(session, media_id, FB_ACCESS_TOKEN),
            )
            media["insights"] = insights
            media["comments"] = comments
            enriched_media.append(media)

            progress = 35 + int((idx + 1) / total_media * 55)
            update_pipeline_status(user_email, {
                'stage':               'ingest',
                'ingest_status':       'running',
                'progress':            progress,
                'progress_percentage': progress,
                'message':             f'Processing media {idx + 1}/{total_media}...',
                'updated_at':          datetime.now(timezone.utc).isoformat(),
            })

    # Pub/Sub
    payload      = {
        "timestamp":        datetime.now(timezone.utc).isoformat(),
        "user_email":       user_email,
        "username":         USERNAME,
        "profile":          profile,
        "profile_insights": profile_insights,
        "media":            enriched_media,
    }
    message_data = json.dumps(payload).encode("utf-8")
    future       = publisher.publish(topic_path, message_data)
    message_id   = future.result()
    print(f"Published to Pub/Sub: {message_id}")

    # Firestore saves
    user_raw_ref = db.collection('users_data').document(user_email).collection('raw_data')
    user_raw_ref.document('profile').set({
        **profile,
        'profile_insights_totals': profile_insights["totals"],
        'profile_insights_daily':  profile_insights["daily"],
        'updated_at': datetime.now(timezone.utc).isoformat(),
    })

    db.collection('users_data').document(user_email)\
      .collection('profile').document('summary').set({
        'account_type':    account_type,
        'followers_count': profile.get('followers_count'),
        'media_count':     profile.get('media_count'),
        'username':        profile.get('username'),
        **profile_insights["totals"],
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }, merge=True)

    db.collection('users_data').document(user_email)\
      .collection('profile_insights_daily').document('data').set({
        'daily':      profile_insights["daily"],
        'updated_at': datetime.now(timezone.utc).isoformat(),
    })

    for media in enriched_media:
        user_raw_ref.document(media['id']).set({
            **media,
            'ingested_at': datetime.now(timezone.utc).isoformat(),
        })

    update_pipeline_status(user_email, {
        'stage':                 'ingest',
        'ingest_status':         'completed',
        'progress':              100,
        'progress_percentage':   100,
        'message':               'Ingest completed! Starting processing...',
        'records_ingested':      total_media,
        'ingest_completed_at':   datetime.now(timezone.utc).isoformat(),
        'updated_at':            datetime.now(timezone.utc).isoformat(),
        'error_message':         None,
        'failed_at':             None,
    })

    print(f"Ingest completed for {user_email}. Total media: {total_media}")
    return {
        'status':           'success',
        'user_email':       user_email,
        'username':         USERNAME,
        'records_ingested': total_media,
        'message_id':       message_id,
    }


# ==============================
# CLOUD FUNCTION ENTRY POINT (sync wrapper)
# ==============================
def ingest_instagram_data(request):
    try:
        request_json = request.get_json(silent=True)

        if not request_json or 'user_email' not in request_json:
            return {'error': 'user_email is required in request body'}, 400

        user_email = request_json['user_email']
        print(f"Starting ingest for user: {user_email}")

        # Sync entry point — async pipeline ko yahan run karo
        result = asyncio.run(run_ingest_pipeline(user_email))
        return result, 200

    except Exception as e:
        print(f"Ingest failed: {e}")
        if 'user_email' in locals():
            update_pipeline_status(user_email, {
                'stage':           'failed',
                'ingest_status':   'failed',
                'progress':        0,
                'progress_percentage': 0,
                'message':         f'Ingest failed: {str(e)}',
                'error_message':   str(e),
                'failed_at':       datetime.now(timezone.utc).isoformat(),
                'updated_at':      datetime.now(timezone.utc).isoformat(),
            })
        return {'status': 'error', 'error': str(e)}, 500