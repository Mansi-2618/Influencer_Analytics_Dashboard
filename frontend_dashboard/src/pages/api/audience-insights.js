// Requirements: Business/Creator account + 100+ followers
// Token: Facebook Page Access Token — session.pageaccess_token (set in nextauth session callback)

import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE    = `https://graph.facebook.com/${GRAPH_VERSION}`;

// ── Fetch one breakdown ───────────────────────────────────────────────────────
async function fetchBreakdown(igUserId, breakdown, accessToken) {
  const url = new URL(`${GRAPH_BASE}/${igUserId}/insights`);
  url.searchParams.set("metric",       "follower_demographics");
  url.searchParams.set("period",       "lifetime");
  url.searchParams.set("timeframe",    "this_month");
  url.searchParams.set("metric_type",  "total_value");
  url.searchParams.set("breakdown",    breakdown);
  url.searchParams.set("access_token", accessToken);

  const res  = await fetch(url.toString());
  const json = await res.json();

  if (json.error) {
    console.warn(`[audience] breakdown=${breakdown}: ${json.error.message}`);
    return null;
  }

  // Response: { data: [{ total_value: { breakdowns: [{ results: [...] }] } }] }
  return json?.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? null;
}

// ── Get IG User ID from Page Access Token ────────────────────────────────────
// pageaccess_token is a Facebook Page Access Token.
// With it, we can directly call /me?fields=instagram_business_account
// to get the IG Business Account ID linked to that page — no /accounts loop needed.
async function getIgUserId(pageAccessToken) {
  const url = `${GRAPH_BASE}/me?fields=id,instagram_business_account&access_token=${pageAccessToken}`;
  const res  = await fetch(url);
  const json = await res.json();

  if (json.error) {
    console.warn("[audience] getIgUserId error:", json.error.message);
    return null;
  }

  // instagram_business_account.id is the IG User ID we need for insights calls
  const igUserId = json?.instagram_business_account?.id;
  if (!igUserId) {
    console.warn("[audience] No instagram_business_account linked to this Facebook Page");
    return null;
  }

  return igUserId;
}

// ── Transformers ──────────────────────────────────────────────────────────────
const AGE_COLORS     = ["#f97316","#3b82f6","#22c55e","#a855f7","#eab308","#ec4899","#14b8a6"];
const CITY_COLORS    = ["#f97316","#3b82f6","#22c55e","#a855f7","#eab308","#ec4899"];
const COUNTRY_COLORS = ["#f97316","#3b82f6","#22c55e","#a855f7","#eab308"];
const GENDER_COLORS  = { M:"#3b82f6", F:"#ec4899", U:"#94a3b8" };

function toPercents(results) {
  if (!results?.length) return [];
  const total = results.reduce((s, r) => s + (r.value || 0), 0) || 1;
  return results.map((r) => ({
    raw_label: r.dimension_values?.[0] ?? "Unknown",
    count:     r.value || 0,
    pct:       Math.round(((r.value || 0) / total) * 100),
  }));
}

function parseAge(results) {
  return toPercents(results)
    .sort((a, b) => b.count - a.count)
    .map((r, i) => ({
      label: r.raw_label,
      count: r.count,
      pct:   r.pct,
      color: AGE_COLORS[i % AGE_COLORS.length],
    }));
}

function parseGender(results) {
  return toPercents(results)
    .map((r) => ({
      label: r.raw_label === "M" ? "Male" : r.raw_label === "F" ? "Female" : "Other",
      count: r.count,
      pct:   r.pct,
      color: GENDER_COLORS[r.raw_label] ?? "#94a3b8",
    }))
    .filter((g) => g.pct > 0);
}

function parseCity(results, topN = 6) {
  return toPercents(results)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((r, i) => ({
      label: r.raw_label.split(",")[0].trim(),
      full:  r.raw_label,
      count: r.count,
      pct:   r.pct,
      color: CITY_COLORS[i % CITY_COLORS.length],
    }));
}

function parseCountry(results, topN = 5) {
  return toPercents(results)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((r, i) => ({
      label: r.raw_label,
      count: r.count,
      pct:   r.pct,
      color: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
    }));
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // ── Get session ──────────────────────────────────────────────────────────────
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // ── Extract pageaccess_token ─────────────────────────────────────────────────
  // nextauth session callback sets: session.pageaccess_token = token.pageaccess_token
  // This is the Facebook Page Access Token — used for all IG Graph API calls
  const pageAccessToken = session.pageaccess_token;

  if (!pageAccessToken) {
    return res.status(401).json({
      error: "pageaccess_token missing from session",
      hint:  "Make sure the user has connected their Instagram account",
    });
  }

  try {
    // Step 1: Get IG Business Account ID linked to the Facebook Page
    const igUserId = await getIgUserId(pageAccessToken);

    if (!igUserId) {
      return res.status(422).json({
        error: "Instagram Business Account not found",
        hint:  "Make sure your Instagram account is Business or Creator type and linked to a Facebook Page",
      });
    }

    // Step 2: Fetch all 4 breakdowns in parallel using pageAccessToken
    const [ageResults, genderResults, cityResults, countryResults] = await Promise.all([
      fetchBreakdown(igUserId, "age",     pageAccessToken),
      fetchBreakdown(igUserId, "gender",  pageAccessToken),
      fetchBreakdown(igUserId, "city",    pageAccessToken),
      fetchBreakdown(igUserId, "country", pageAccessToken),
    ]);

    // Step 3: Transform to UI-ready format
    const age_groups    = parseAge(ageResults);
    const gender_split  = parseGender(genderResults);
    const top_cities    = parseCity(cityResults);
    const top_countries = parseCountry(countryResults);

    // Step 4: Return
    return res.status(200).json({
      source:       "instagram_graph_api_v21",
      fetched_at:   new Date().toISOString(),
      ig_user_id:   igUserId,
      age_groups,
      gender_split,
      top_cities,
      top_countries,
    });

  } catch (err) {
    console.error("[audience-insights] Error:", err);
    return res.status(500).json({ error: "Failed to fetch audience insights", details: err.message });
  }
}