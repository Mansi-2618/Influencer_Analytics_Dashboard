import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { generateAlerts } from "@/lib/alerts";
import {Home, Lightbulb, LayoutDashboard, Gauge, Users} from "lucide-react";

import Header from "@/components/Header";
import MetricsRow from "@/components/MetricsRow";
import AlertsPanel from "@/components/AlertsPanel";
import MediaTable from "@/components/MediaTable";

import ReachTrendChart from "@/components/charts/ReachTrendChart";
import ViralityScatter from "@/components/charts/ViralityScatter";
import EngagementTrendChart from "@/components/charts/EngagementTrendChart";
import MediaTypePerformanceChart from "@/components/charts/MediaTypePerformanceChart";
import TopCommentersChart from "@/components/charts/TopCommentersChart";
import MetricSection from "@/components/MetricSection";
import HookEfficiencyChart from "@/components/charts/HookEfficiencyDistribution";
import RewatchRatioChart from "@/components/charts/RewatchRatioChart";
import SentimentDistributionChart from "@/components/charts/SentimentDistributionChart";
import MediaWiseSentimentTrendChart from "@/components/charts/MediaWiseSentimentTrendChart";
import InsightsPage from "@/components/InsightsPage";
// IMPORT DASHBOARD STYLES
import DashboardStyles from "@/components/DashboardStyles";

export default function Dashboard() {
  const { data: session, status } = useSession();

  // ---------------- STATE ----------------
  const [profile, setProfile] = useState(null);
  const [media, setMedia] = useState([]);
  const [comments, setComments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [mediaType, setMediaType] = useState("All");
  const [topNCommenters, setTopNCommenters] = useState(5);
  const [sentimentSummary, setSentimentSummary] = useState(null);
  const [mediaSentiment, setMediaSentiment] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardGeneratedAt, setDashboardGeneratedAt] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("google");
    }
  }, [status]);

  // ---------------- FETCH DATA ---------------
  useEffect(() => {
    if (status !== "authenticated") return;

    let isMounted = true;

    async function fetchData() {
      try {
        // ---------- PROFILE ----------
        console.log("Fetching profile...");
        const profileRes = await fetch("/api/profile");
        const profileJson = await profileRes.json();

        if (!profileRes.ok) {
          throw new Error(profileJson?.error || "Failed to fetch profile");
        }

        // ---------- MEDIA ----------
        console.log("Fetching media...");
        const mediaRes = await fetch("/api/media");
        const mediaJson = await mediaRes.json();
        const mediaArray = Array.isArray(mediaJson)
          ? mediaJson
          : mediaJson?.data || [];

        // ---------- COMMENTS ----------
        console.log("Fetching comments...");
        const commentsRes = await fetch("/api/comments");
        const commentsJson = await commentsRes.json();
        const commentsArray = Array.isArray(commentsJson)
          ? commentsJson
          : commentsJson?.data || [];

        if (!isMounted) return;

        setProfile(profileJson);
        setMedia(mediaArray);
        setComments(commentsArray);

        setDashboardGeneratedAt(new Date());

        // ---------- ALERTS ----------
        const computedAlerts = generateAlerts({
          profile: profileJson,
          media: mediaArray,
          comments: commentsArray,
        });

        setAlerts(computedAlerts);

        // ---------- SENTIMENT SUMMARY ----------
        const summaryRes = await fetch("/api/sentiment-summary");
        const sentimentJson = await summaryRes.json();
        console.log("Sentiment summary:", sentimentJson);
        setSentimentSummary(sentimentJson);

        const fetchSentimentSummary = async () => {
          try {
            const res = await fetch("/api/sentiment-summary");
            const data = await res.json();

            if (res.ok) {
              setSentimentSummary(data);
            }
          } catch (err) {
            console.error("Failed to fetch sentiment summary", err);
          } finally {
            setLoading(false);
          }
        };
        fetchSentimentSummary();

        // ---------- MEDIA SENTIMENT ----------
        const mediaSentimentRes = await fetch("/api/sentiment-media");
        const mediaSentimentJson = await mediaSentimentRes.json();

        console.log("Media Sentiment Response:", {
          ok: mediaSentimentRes.ok,
          status: mediaSentimentRes.status,
          isArray: Array.isArray(mediaSentimentJson),
          length: Array.isArray(mediaSentimentJson)
            ? mediaSentimentJson.length
            : 0,
          sample: Array.isArray(mediaSentimentJson)
            ? mediaSentimentJson[0]
            : null,
        });

        if (Array.isArray(mediaSentimentJson)) {
          setMediaSentiment(mediaSentimentJson);
          console.log(
            "Media sentiment loaded:",
            mediaSentimentJson.length,
            "items"
          );
        } else {
          console.warn("No media sentiment data");
          setMediaSentiment([]);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    }
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [status]);

  // ---------------- FILTERED MEDIA ----------------
  const filteredMedia =
    mediaType === "All"
      ? media
      : media.filter((m) => m.media_type === mediaType);

  // ---------------- DERIVED DATA ----------------
  // Reach trend
  const reachTrendData = Object.values(
    filteredMedia.reduce((acc, m) => {
      const date = m.timestamp?.split("T")[0];
      if (!date) return acc;

      if (!acc[date]) acc[date] = { date, reach: 0, count: 0 };
      acc[date].reach += m.reach || 0;
      acc[date].count += 1;
      return acc;
    }, {})
  ).map((d) => ({
    date: d.date,
    reach: Math.round(d.reach / d.count),
  }));

  // Engagement trend
  const engagementTrendData = Object.values(
    filteredMedia.reduce((acc, m) => {
      const date = m.timestamp?.split("T")[0];
      if (!date) return acc;

      if (!acc[date]) acc[date] = { date, engagement: 0, count: 0 };
      acc[date].engagement +=
        (m.likes || 0) + (m.comments || 0) + (m.saves || 0);
      acc[date].count += 1;
      return acc;
    }, {})
  ).map((d) => ({
    date: d.date,
    engagement: Math.round(d.engagement / d.count),
  }));

  // Media type performance
  const mediaTypePerformance = Object.values(
    filteredMedia.reduce((acc, m) => {
      const type = m.media_type || "UNKNOWN";
      if (!acc[type])
        acc[type] = { media_type: type, reach: 0, vps: 0, count: 0 };
      acc[type].reach += m.reach || 0;
      acc[type].vps += m.viral_potential_score || 0;
      acc[type].count += 1;
      return acc;
    }, {})
  ).map((d) => ({
    media_type: d.media_type,
    avg_reach: Math.round(d.reach / d.count),
    avg_vps: Number((d.vps / d.count).toFixed(2)),
  }));

  const totalAvgReach = mediaTypePerformance.reduce(
    (sum, d) => sum + d.avg_reach,
    0
  );

  const mediaTypePerformancePercent = mediaTypePerformance.map((d) => ({
    ...d,
    reach_percent: Number(((d.avg_reach / totalAvgReach) * 100).toFixed(1)),
  }));

  // Reels Hook vs Rewatch
  const reelsHookVsRewatchData = filteredMedia
    .filter((m) => {
      const hook = Number(m.hook_efficiency);
      const rewatch = Number(m.rewatch_ratio);

      return (
        m.media_type === "REELS" &&
        Number.isFinite(hook) &&
        Number.isFinite(rewatch)
      );
    })
    .map((m) => ({
      media_id: m.media_id,
      media_type: m.media_type,
      hook_efficiency: +Number(m.hook_efficiency).toFixed(2),
      rewatch_ratio: +Number(m.rewatch_ratio).toFixed(2),
    }));

  //---------Media Sentiment Trend------------
  // ---------------- FILTER MEDIA SENTIMENT ----------------
  const filteredMediaSentiment =
    mediaType === "All"
      ? mediaSentiment
      : mediaSentiment.filter((m) => m.media_type === mediaType);

  // Sort by time
  filteredMediaSentiment.sort(
    (a, b) => new Date(a.updated_at) - new Date(b.updated_at)
  );

  // Build combo chart data
  let cumulative = 0;

  const comboChartData = filteredMediaSentiment.map((m, index) => {
    cumulative += m.avg_sentiment_score;

    return {
      media_id: `Media ${index + 1}: `+ m.media_id,
      date: m.uploaded_at?.split("T")[0] || m.timestamp?.split("T")[0],
      media_sentiment: Number(m.avg_sentiment_score.toFixed(2)),
      overall_sentiment: Number((cumulative / (index + 1)).toFixed(2)),
    };
  });

  // ---------------- TOP COMMENTERS ----------------
  const topCommentersData = Object.values(
    comments.reduce((acc, c) => {
      const user = c.username || "unknown";
      if (!acc[user]) acc[user] = { username: user, count: 0 };
      acc[user].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  const filteredTopCommenters = topCommentersData.slice(0, topNCommenters);

  // ---------------- Conversion Metrics ----------------
  const profileViews = profile?.profile_views ?? 0;
  const websiteClicks = profile?.website_clicks ?? 0;

  const profileToWebsitePct =
    profileViews > 0 ? ((websiteClicks / profileViews) * 100).toFixed(2) : 0;

  const reach = profile?.reach ?? 0;
  const reachToClickPct =
    reach > 0 ? ((websiteClicks / reach) * 100).toFixed(2) : 0;

  const estimatedRoiScore = (
    (Number(profileToWebsitePct) + Number(reachToClickPct)) *
    1.8
  ).toFixed(2);

  // ---------------- Audience Engagement ----------------
  const totalComments = comments.length;

  // ---------------- Greeting ----------------
  const getGreeting = () => {
  const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
  };

  // ---------------- CONDITIONAL RENDER ----------------
  if (status === "loading") {
    return (
      <>
      <Header>Influencer Analytics Dashboard</Header>
        <DashboardStyles />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-500 border-t-transparent mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-white text-xl font-semibold animate-pulse">
              Checking authentication...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!session) {
    return null;
  }

  if (!profile) {
    return (
      <>
        <DashboardStyles />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-500 border-t-transparent mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-white text-xl font-semibold animate-pulse">
              Loading dashboard...
            </p>
          </div>
        </div>
      </>
    );
  }

  // ---------------- JSX ----------------
  return (
    <>
      {/* DASHBOARD STYLES COMPONENT */}
      <DashboardStyles />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        {/* Top Navigation Bar */}
        <nav className="navbar-blur sticky top-0 z-50 shadow-xl">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-4">
                <div className="logo-container bg-slate-800/50 p-2 rounded-lg border border-orange-500/20">
                  <img
                    src="/ca-logo.png"
                    alt="Cloud Ambassadors Logo"
                    className="h-10 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Heading */}
                <div className="hidden md:block">
                  <h2 className="text-slate-50 text-4xl font-heading font-semibold tracking-wide">
                    Influencer Analytics Dashboard
                  </h2>
                </div>

              {/* User Profile & Logout */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
                  <img
                    src={session?.user?.image || "/default-avatar.png"}
                    alt={session?.user?.name || "User"}
                    className="w-10 h-10 rounded-full border-2 border-orange-500"
                  />
                  <div className="hidden lg:block">
                    <p className="text-white font-semibold text-md">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {session?.user?.email || ""}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="ml-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-md font-medium transition-all duration-200 border border-red-500/30"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex">
          {/* Left Sidebar */}
          <aside
            className={`${
              isSidebarCollapsed ? "w-20" : "w-64"
            } bg-[#1a2a4a]/80 backdrop-blur-sm border-r border-slate-700/50 min-h-screen sticky top-16`}
          >
            <div className="p-4">
              {/* Collapse Toggle */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-full mb-6 p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-slate-300 hover:text-white"
              >
                {isSidebarCollapsed ? "→" : "←"}
              </button>

              {/* Navigation Items */}
              <div className="space-y-2">
                <SidebarItem
                  icon={Home}
                  label="Home"
                  isActive={activeTab === "dashboard"}
                  isCollapsed={isSidebarCollapsed}
                  onClick={() => {
                    setActiveTab("dashboard");
                    setIsSidebarCollapsed(false);
                  }}
                />
                <SidebarItem
                  icon={LayoutDashboard}
                  label="Dashboard"
                  isActive={activeTab === "analytics"}
                  isCollapsed={isSidebarCollapsed}
                  onClick={() => {
                    setActiveTab("analytics");
                    setIsSidebarCollapsed(true);
                  }}
                />
                <SidebarItem
                  icon={Lightbulb}
                  label="Insights"
                  isActive={activeTab === "insights"}
                  isCollapsed={isSidebarCollapsed}
                  onClick={() => {
                    setActiveTab("insights"); setIsSidebarCollapsed(true);}}
                />
              </div>
            </div>
          </aside>

          {/* Main Dashboard Content */}
          <main className="flex-1 p-8">
            {/* ── INSIGHTS TAB ── */}
            {activeTab === "insights" && (
              <InsightsPage
                media={media}
                comments={comments}
                profile={profile}
                sentimentSummary={sentimentSummary}
                mediaSentiment={mediaSentiment}
              />
            )}
            {activeTab !== "insights" && (
              <>
            {/* Welcome Header */}
            <div className="relative mb-8 bg-gradient-to-r from-orange-500/20 to-blue-500/20 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-8 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {getGreeting()}, {session.user.name}! 👋
                  </h1>
                  <p className="text-slate-300 text-lg">
                    Here's what's happening with your Instagram today.
                  </p>
                </div>
                <div className="absolute top-6 right-6">
                  <div className="text-right">
                    <p className="text-slate-300 text-sm uppercase tracking-wide">
                      Last Updated
                    </p>
                    <p className="text-slate-200 font-semibold text-sm">
                      {dashboardGeneratedAt? dashboardGeneratedAt.toLocaleString(): "--"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="mb-8 animate-slide-left">
              <MetricsRow profile={profile} />
            </div>

            {/* Conversion Metrics */}
            <div className="mb-8 animate-slide-right">
              <MetricSection
                title="Conversion Metrics"
                icon={Gauge}
                metrics={[
                  {
                    label: "Profile → Website (%)",
                    value: profileToWebsitePct + "%",
                  },
                  {
                    label: "Reach → Click (%)",
                    value: reachToClickPct + "%",
                  },
                  {
                    label: "Estimated ROI Score",
                    value: estimatedRoiScore,
                  },
                ]}
              />
            </div>

            {/* Audience Engagement */}
            <div className="mb-8 animate-fade-in">
              <MetricSection
                title="Audience Engagement"
                icon={Users}
                iconColor="text-purple-500"
                titleColor="text-slate-50"
                metrics={[
                  {
                    label: "Total Comments",
                    value: totalComments,
                  },
                  {
                    label: "Average Sentiment",
                    value: sentimentSummary?.average_sentiment_score !== undefined
                      ? `${(sentimentSummary.average_sentiment_score * 100).toFixed(1)}%`
                      : "--",
                  },
                ]}
              />
            </div>

            {/* Alerts Panel */}
            <div className="mb-6">
              <AlertsPanel alerts={alerts} />
            </div>

            {/* Filter */}
            <div className="mb-6 glass-card rounded-xl p-2 shadow-lg">
              <div className="flex items-center space-x-4">
                <label className="text-slate-300 font-medium">
                  Filter by Content Type:
                </label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="bg-slate-900/50 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="All">All Content</option>
                  <option value="REELS">Reels</option>
                  <option value="FEED">Feed Posts</option>
                </select>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ReachTrendChart data={reachTrendData} />
              <EngagementTrendChart data={engagementTrendData} />
              <MediaTypePerformanceChart data={mediaTypePerformancePercent} />
              <ViralityScatter data={filteredMedia} />
              <HookEfficiencyChart data={reelsHookVsRewatchData} />
              <RewatchRatioChart data={reelsHookVsRewatchData} />
              {sentimentSummary && (
                <SentimentDistributionChart summary={sentimentSummary} />
              )}
              <MediaWiseSentimentTrendChart data={comboChartData} />
            </div>

            {/* Top Commenters */}
            <div className="mb-8">
              {/* SINGLE GRAPH CARD */}
              <div className="bg-[#1a2a4a]/80 rounded-2xl p-4 shadow-lg relative">

                {/* Header INSIDE graph card */}
                <div className="flex items-center justify-between mb-3">
                  {/* FILTER – TOP RIGHT */}
                  <select
                    value={topNCommenters}
                    onChange={(e) => setTopNCommenters(Number(e.target.value))}
                    className="bg-slate-900/60 text-white border border-slate-600
                    rounded-md px-3 py-1 text-sm focus:outline-none
                    focus:ring-1 focus:ring-orange-500"
                  >
                    <option value={5}>Top 5</option>
                    <option value={10}>Top 10</option>
                    <option value={15}>Top 15</option>
                    <option value={20}>Top 20</option>
                  </select>
                </div>

                {/* CHART */}
                <TopCommentersChart data={filteredTopCommenters} />
              </div>
            </div>

            {/* Media Table */}
            <div className="animate-fade-in">
              <MediaTable media={filteredMedia} />
            </div>
            </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

// Sidebar Item Component
function SidebarItem({ icon: Icon, label, isActive, isCollapsed, onClick }) {
  if (!Icon) return null;

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
        ${
          isActive
            ? "bg-orange-500/15 text-orange-400"
            : "text-slate-400 hover:text-white hover:bg-slate-700/40"
        }`}
      >
        {/* OUTLINE ICON ONLY */}
        <Icon
          className={`w-5 h-5 transition-colors duration-200
          ${
            isActive
              ? "stroke-orange-400"
              : "stroke-slate-400 group-hover:stroke-white"
          }`}
        />

        {!isCollapsed && (
          <span className="font-medium whitespace-nowrap">{label}</span>
        )}
      </button>

      {/* Tooltip when collapsed */}
      {isCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-all duration-200 z-50"
        >
          <div className="bg-slate-900 text-white text-xs px-3 py-1 rounded-md shadow-lg border border-slate-700">
            {label}
          </div>
        </div>
      )}
    </div>
  );
}