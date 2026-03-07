"use client";
import { useState, useEffect } from "react";
import {
  Lightbulb, TrendingUp, TrendingDown,
  Flame, Video, Image, Moon, Coffee,
  CheckCircle, XCircle,
  MessageCircle, Heart, Bookmark, Eye,
} from "lucide-react";

// ─────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:36, marginBottom:16 }}>
      <span style={{ fontSize:"1rem", textTransform:"uppercase", letterSpacing:"0.16em", color:"#f97316", fontWeight:600, whiteSpace:"nowrap" }}>
        {children}
      </span>
      <div style={{ flex:1, height:1, background:"rgba(249,115,22,0.28)" }} />
    </div>
  );
}

function Card({ children, style={} }) {
  return (
    <div style={{ background:"#1a2a4a", borderRadius:18, padding:"28px 30px", border:"1px solid rgba(148,163,184,0.1)", ...style }}>
      {children}
    </div>
  );
}

function CardTitle({ dotColor, children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, fontWeight:700, fontSize:"1.25rem", color:"#fff", marginBottom:20 }}>
      <span style={{ width:10, height:10, borderRadius:"50%", background:dotColor, display:"inline-block", flexShrink:0 }} />
      {children}
    </div>
  );
}

function PBarRow({ label, pct, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
      <span style={{ width:110, fontSize:"1rem", color:"#f1f5f9", flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, height:9, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:4 }} />
      </div>
      <span style={{ width:42, fontSize:"0.95rem", color:"#94a3b8", textAlign:"right", flexShrink:0 }}>{pct}%</span>
    </div>
  );
}


// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
export default function InsightsPage({
  media=[], comments=[], profile={}, sentimentSummary=null, mediaSentiment=[],
}) {
  
  // ── Audience API state ───────────────────────────────────────────────────
  const [audienceAPI,    setAudienceAPI]    = useState(null);
  const [audienceData, setAudienceData] = useState("loading");

  // This is the source of truth for account_type and followers_count.  
  // ── Validation ──────────────────────────────
    const accountType         = profile?.account_type  || "UNKNOWN";
    const followersCount      = profile?.followers      ?? profile?.followers_count ?? 0;
    const isBusinessOrCreator = accountType === "BUSINESS_OR_CREATOR";
    const hasEnoughFollowers  = followersCount >= 100;
    const meetsRequirements   = isBusinessOrCreator && hasEnoughFollowers;

    useEffect(() => {
      if (!meetsRequirements) {
        setAudienceData("locked");
        return;
      }
      setAudienceData("loading");
      fetch("/api/audience-insights")
        .then((r) => r.json())
        .then((d) => {
          if (d?.age_groups?.length > 0) setAudienceAPI(d);
          setAudienceData("done");
        })
        .catch(() => setAudienceData("done"));
    }, [meetsRequirements]);

  // ── Core derived numbers ─────────────
  const reels      = media.filter((m) => m.media_type === "REELS");
  const feed       = media.filter((m) => m.media_type === "FEED");
  const total      = media.length || 1;
  const totalReach = media.reduce((s,m) => s+(m.reach||0), 0);
  const totalLikes = media.reduce((s,m) => s+(m.likes||0), 0);
  const totalSaves = media.reduce((s,m) => s+(m.saves||0), 0);
  const avgReach   = totalReach / total;

  const avgReelsReach = reels.reduce((s,m) => s+(m.reach||0),0) / (reels.length||1);
  const avgFeedReach  = feed.reduce( (s,m) => s+(m.reach||0),0) / (feed.length ||1);
  const avgHook       = reels.reduce((s,m) => s+(Number(m.hook_efficiency)||0),0) / (reels.length||1);
  const avgRewatch    = reels.reduce((s,m) => s+(Number(m.rewatch_ratio)||0),0)   / (reels.length||1);

  const engRate      = ((totalLikes + comments.length) / (totalReach||1)) * 100;
  const sentimentPct = sentimentSummary?.average_sentiment_score != null
    ? sentimentSummary.average_sentiment_score * 100 : 0;

  const uniqueC        = new Set(comments.map((c) => c.username)).size;
  const uniqueRatio    = (uniqueC / (comments.length||1)) * 100;
  const volumeBonus    = comments.length>=100?10 : comments.length>=50?5 : 0;
  const communityScore = Math.min(100, Math.round(uniqueRatio*0.7 + volumeBonus));

  const dates     = media.map((m) => new Date(m.timestamp)).filter(Boolean).sort((a,b)=>a-b);
  const daySpan   = dates.length>1 ? (dates[dates.length-1]-dates[0])/86400000 : 1;
  const postFreq  = (media.length/daySpan)*7;

  // ── Calibrated scores ────────────────
  const hookScore          = Math.min(100, avgHook);
  const rewatchScore       = Math.min(100, avgRewatch*100);
  const reelsStrategyScore = Math.min(100, Math.round((hookScore + rewatchScore) / 2));
  const sentimentScore     = Math.min(100, Math.round(sentimentPct));
  const feedScore          = avgReach>0 ? Math.min(100, Math.round((avgFeedReach/avgReach)*100)) : 0;
  const consistScore       = postFreq>=5?100 : postFreq>=3?80 : postFreq>=2?60 : postFreq>=1?40 : 20;

  const reportCards = [
    { label:"Reels Strategy",      score:reelsStrategyScore, desc:`Hook ${avgHook.toFixed(0)}% · Rewatch ${(avgRewatch*100).toFixed(0)}%` },
    { label:"Audience Sentiment",  score:sentimentScore,     desc:`${sentimentPct.toFixed(1)}% positive comments`                         },
    { label:"Engagement Rate",     score:Math.min(100,parseFloat(engRate.toFixed(2))),  desc:`${engRate.toFixed(2)}% engagement rate`     },
    { label:"Feed Posts",          score:feedScore,          desc:"Avg reach vs account average"                                          },
    { label:"Posting Consistency", score:consistScore,       desc:`~${postFreq.toFixed(1)} posts/week`                                    },
    { label:"Community Building",  score:communityScore,     desc:`${uniqueC} unique commenters`                                          },
  ];

  function getScoreColor(s) {
    if (s>=80) return "#22c55e";
    if (s>=60) return "#3b82f6";
    if (s>=40) return "#f97316";
    return "#ef4444";
  }
  function getBarGrad(s) {
    if (s>=80) return "linear-gradient(90deg,#22c55e,#4ade80)";
    if (s>=60) return "linear-gradient(90deg,#3b82f6,#60a5fa)";
    if (s>=40) return "linear-gradient(90deg,#f97316,#fb923c)";
    return             "linear-gradient(90deg,#ef4444,#f87171)";
  }

  // ── What's Working / Not ─────────────
  const working    = [];
  const notWorking = [];

  if (reelsStrategyScore >= 60)
    working.push(`Reels hook & rewatch ratio is strong — viewers are watching through (hook ${avgHook.toFixed(0)}%)`);
  else
    notWorking.push(`Reels hook efficiency is low (${avgHook.toFixed(0)}%) — improve your first 3 seconds to retain viewers`);

  if (engRate >= 65)
    working.push(`Engagement rate of ${engRate.toFixed(2)}% is above industry average of 3.8%`);
  else
    notWorking.push(`Engagement rate ${engRate.toFixed(2)}% is below avg — add stronger CTAs and questions in captions`);

  if (sentimentScore >= 70)
    working.push(`${sentimentPct.toFixed(0)}% positive audience sentiment shows strong brand trust`);
  else
    notWorking.push("Negative sentiment is high — review flagged comments and respond to concerns publicly");

  if (communityScore >= 60)
    working.push(`${uniqueC} unique commenters shows a loyal, returning audience community`);
  else
    notWorking.push("Most comments come from the same users — broaden reach to attract new commenters");

  if (consistScore >= 60)
    working.push(`Posting ~${postFreq.toFixed(1)}×/week keeps the algorithm favouring your content`);
  else
    notWorking.push(`Only ~${postFreq.toFixed(1)} posts/week — post more consistently to improve algorithmic reach`);

  if (avgReelsReach > avgFeedReach)
    working.push(`Reels reach (${Math.round(avgReelsReach).toLocaleString()}) is outperforming Feed (${Math.round(avgFeedReach).toLocaleString()}) — double down on video`);
  else
    notWorking.push("Feed posts are reaching more than Reels — revisit your Reels content strategy and hooks");

  if (totalSaves > 0) {
    const saveRate = (totalSaves/(totalReach||1))*100;
    if (saveRate > 1)
      working.push(`Save rate of ${saveRate.toFixed(1)}% signals content people want to revisit and share`);
    else
      notWorking.push("Save rate is very low — create more educational, tip-style or reference content to drive saves");
  }

  const workingFinal    = working.slice(0,5);
  const notWorkingFinal = notWorking.slice(0,5);

  // ── Calendar ─────────────────────────
  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const dayMap = {};
  media.forEach((m) => {
    if (!m.timestamp) return;
    const k = new Date(m.timestamp).toLocaleDateString("en-US",{weekday:"short"});
    if (!dayMap[k]) dayMap[k]={total:0,count:0};
    dayMap[k].total += (m.likes||0)+(m.comments||0)+(m.saves||0);
    dayMap[k].count += 1;
  });
  const dayAvg  = DAYS.map((d) => ({ day:d, avg:dayMap[d]?Math.round(dayMap[d].total/dayMap[d].count):0 }));
  const bestDay = dayAvg.reduce((a,b)=>(a.avg>b.avg?a:b),{avg:0,day:"Wed"});

  const baseCalConfig = {
    Mon:{ type:"rest", Icon:Moon,   label:"Rest"  },
    Tue:{ type:"reel", Icon:Video,  label:"Reel"  },
    Wed:{ type:"feed", Icon:Image,  label:"Feed"  },
    Thu:{ type:"reel", Icon:Video,  label:"Reel"  },
    Fri:{ type:"feed", Icon:Image,  label:"Feed"  },
    Sat:{ type:"reel", Icon:Video,  label:"Reel"  },
    Sun:{ type:"rest", Icon:Coffee, label:"Rest"  },
  };
  const calSlots = DAYS.map((d) => {
    const isBest = d === bestDay.day;
    return isBest
      ? { day:d, isBest:true,  type:"best", Icon:Flame, label:"Best Day" }
      : { day:d, isBest:false, ...baseCalConfig[d] };
  });
  const slotColors = {
    best:{ bg:"rgba(34,197,94,0.12)",   border:"rgba(34,197,94,0.3)",   color:"#4ade80" },
    reel:{ bg:"rgba(59,130,246,0.12)",  border:"rgba(59,130,246,0.3)",  color:"#60a5fa" },
    feed:{ bg:"rgba(249,115,22,0.12)",  border:"rgba(249,115,22,0.3)",  color:"#fb923c" },
    rest:{ bg:"rgba(255,255,255,0.03)", border:"rgba(148,163,184,0.1)", color:"#94a3b8" },
  };

  // ── Audience Persona — derived vars (used in unlocked state too) ─────────


  const dayColors = ["#f97316","#3b82f6","#22c55e","#a855f7","#eab308","#ec4899","#14b8a6"];
  const dayActivityData = dayAvg
    .filter(d=>d.avg>0)
    .sort((a,b)=>b.avg-a.avg)
    .map((d,i) => ({
      label: d.day,
      pct: Math.round((d.avg / (dayAvg.reduce((mx,x)=>Math.max(mx,x.avg),1))) * 100),
      color: dayColors[i%dayColors.length],
    }));

  const reelsPct = Math.round((reels.length/total)*100);
  const feedPct  = 100-reelsPct;

  // ── Hashtags ─────────────────────────
  const tagFreqMap = {};
  media.forEach((m) => {
    const tags = (m.caption||"").match(/#\w+/g)||[];
    tags.forEach((t) => { const k=t.toLowerCase(); tagFreqMap[k]=(tagFreqMap[k]||0)+1; });
  });
  const topExtracted = Object.entries(tagFreqMap)
    .sort((a,b)=>b[1]-a[1]).slice(0,8)
    .map(([tag,count],i) => ({
      tag, count,
      boost: i<2?"High" : i<5?"Medium" : "Low",
      color: i<2?"#22c55e" : i<5?"#f97316" : "#ef4444",
    }));
  const hasRealTags = topExtracted.length >= 2;
  const hashtagData = hasRealTags ? topExtracted : [
    { tag:"#instareels",       boost:"High",     color:"#22c55e", count:null },
    { tag:"#cloudtech",        boost:"High",     color:"#22c55e", count:null },
    { tag:"#techinfluencer",   boost:"Medium",   color:"#f97316", count:null },
    { tag:"#digitalmarketing", boost:"Medium",   color:"#f97316", count:null },
    { tag:"#lifestyle",        boost:"Low",      color:"#ef4444", count:null },
    { tag:"#viral",            boost:"Avoid ⚠️", color:"#ef4444", count:null },
  ];
  const suggestedTags = [
    { tag:"#reelsviral",      why:"High discovery reach for Reels"      },
    { tag:"#instagramreels",  why:"Broad audience, great for new posts"  },
    { tag:"#growthhacking",   why:"Tech-savvy audience engagement"       },
    { tag:"#contentcreator",  why:"Strong creator community"             },
    { tag:"#socialmediatips", why:"High save rate on tip-style content"  },
    { tag:"#explorepage",     why:"Boosts algorithmic distribution"      },
  ];

  // ── Benchmark ───────────────────────
  const myReach   = Math.round(totalReach/total);
  const myEngRate = engRate.toFixed(2);
  const myFreq    = postFreq.toFixed(1);
  const mySent    = `${sentimentPct.toFixed(0)}% Positive`;

  // ─────────────────────────────────────
  return (
    <div style={{ color:"#f1f5f9" }}>

      {/* PAGE HEADER */}
      <div style={{
        display:"flex", alignItems:"center", gap:18,
        background:"linear-gradient(135deg,rgba(249,115,22,0.18),rgba(59,130,246,0.1))",
        border:"1px solid rgba(249,115,22,0.28)", borderRadius:20,
        padding:"30px 38px", marginBottom:8, position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", right:-40, top:-40, width:200, height:200, background:"radial-gradient(circle,rgba(249,115,22,0.1),transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />
        <div style={{ width:56, height:56, flexShrink:0, background:"rgba(249,115,22,0.12)", border:"1px solid rgba(249,115,22,0.28)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Lightbulb color="#f97316" size={28} />
        </div>
        <div>
          <h1 style={{ fontSize:"2rem", fontWeight:800, color:"#fff", margin:0 }}>Insights</h1>
          <p style={{ color:"#94a3b8", marginTop:5, fontSize:"1.05rem" }}>
            Smart analysis & actionable recommendations powered by your real Instagram data
          </p>
        </div>
      </div>

      {/* ══════ 1. CONTENT REPORT CARD ══════ */}
      <SectionLabel>✦ Content Report Card</SectionLabel>
      <Card>
        <CardTitle dotColor="#eab308">How Each Content Area is Performing</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {reportCards.map((rc) => {
            const color = getScoreColor(rc.score);
            return (
              <div key={rc.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(148,163,184,0.1)", borderRadius:12, padding:"16px 18px", display:"flex", alignItems:"flex-start", gap:14 }}>
                <div style={{ width:13, height:13, borderRadius:"50%", background:color, flexShrink:0, marginTop:5, boxShadow:`0 0 8px ${color}99` }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <strong style={{ display:"block", color:"#fff", fontSize:"1rem" }}>{rc.label}</strong>
                  <span style={{ color:"#94a3b8", fontSize:"1rem" }}>{rc.desc}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
                    <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${rc.score}%`, height:"100%", background:getBarGrad(rc.score), borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:"1rem", fontWeight:600, color, flexShrink:0, minWidth:36, textAlign:"right" }}>{Number(rc.score).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ══════ 2. WHAT'S WORKING / NOT ══════ */}
      <SectionLabel>✦ What's Working vs What's Not</SectionLabel>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

        <div style={{ background:"#1a2a4a", borderRadius:18, padding:"26px 28px", border:"1px solid rgba(34,197,94,0.2)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
            <TrendingUp color="#22c55e" size={22} />
            <span style={{ fontWeight:700, fontSize:"1.05rem", color:"#22c55e" }}> What's Working</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
            {workingFinal.map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, fontSize:"0.95rem", color:"#f1f5f9", lineHeight:1.6 }}>
                <CheckCircle size={17} color="#22c55e" style={{ flexShrink:0, marginTop:2 }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:"#1a2a4a", borderRadius:18, padding:"26px 28px", border:"1px solid rgba(239,68,68,0.2)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
            <TrendingDown color="#ef4444" size={22} />
            <span style={{ fontWeight:700, fontSize:"1.05rem", color:"#ef4444" }}> What's Not Working</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
            {notWorkingFinal.map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, fontSize:"0.95rem", color:"#f1f5f9", lineHeight:1.6 }}>
                <XCircle size={17} color="#ef4444" style={{ flexShrink:0, marginTop:2 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ 3. HASHTAG PERFORMANCE ══════ */}
      <SectionLabel>✦ Hashtag Performance</SectionLabel>
      <Card>
        <CardTitle dotColor="#a855f7">Your Hashtag Usage & Performance</CardTitle>
        <p style={{ fontSize:"1rem", color:"#94a3b8", marginBottom:14 }}>
          {hasRealTags ? "Based on your post captions:" : "Recommended hashtag performance tiers for your niche:"}
        </p>

        <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:22 }}>
          {hashtagData.map((h) => (
            <div key={h.tag} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${h.color}44`, borderRadius:10, padding:"11px 16px" }}>
              <div style={{ fontSize:"1rem", color:h.color, fontWeight:600 }}>{h.tag}</div>
              <div style={{ fontSize:"0.88rem", color:"#94a3b8", marginTop:3 }}>
                {h.boost} Impact{h.count!=null?` · used ${h.count}×`:""}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:18, marginBottom:22, flexWrap:"wrap" }}>
          {[["#22c55e","High Impact"],["#f97316","Medium Impact"],["#ef4444","Low / Avoid"]].map(([c,l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:7, fontSize:"1rem", color:"#94a3b8" }}>
              <div style={{ width:9, height:9, borderRadius:2, background:c }} />{l}
            </div>
          ))}
        </div>

        <div style={{ borderTop:"1px solid rgba(148,163,184,0.1)", paddingTop:18 }}>
          <p style={{ fontSize:"0.92rem", color:"#f97316", fontWeight:600, marginBottom:14, textTransform:"uppercase", letterSpacing:"0.08em" }}>
            💡 Suggested Hashtags to Try
          </p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {suggestedTags.map((s) => (
              <div key={s.tag} style={{ background:"rgba(249,115,22,0.08)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:8, padding:"10px 14px" }}>
                <div style={{ fontSize:"1rem", color:"#fb923c", fontWeight:500 }}>{s.tag}</div>
                <div style={{ fontSize:"0.95rem", color:"#94a3b8", marginTop:3 }}>{s.why}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ══════ 4. AUDIENCE PERSONA ══════ */}
      <SectionLabel>✦ Audience Persona</SectionLabel>

      {audienceData === "loading" && (
        <Card>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 0", gap:14 }}>
            <div style={{ width:18, height:18, borderRadius:"50%", border:"2px solid #f97316", borderTopColor:"transparent", animation:"spin 0.8s linear infinite" }} />
            <span style={{ color:"#94a3b8", fontSize:"1rem" }}>Checking your account eligibility...</span>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Card>
      )}

      {audienceData === "locked" && (
        <Card style={{ border:"1px solid rgba(148,163,184,0.15)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, opacity:0.07, filter:"blur(6px)", pointerEvents:"none", padding:"28px 30px" }}>
            {[80,55,35,20].map((w,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ width:90, height:10, borderRadius:4, background:"#94a3b8" }} />
                <div style={{ flex:1, height:10, borderRadius:4, background:`rgba(148,163,184,${0.4-i*0.07})`, maxWidth:`${w}%` }} />
              </div>
            ))}
          </div>
          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"rgba(148,163,184,0.08)", border:"1px solid rgba(148,163,184,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:"1.1rem", color:"#f1f5f9" }}>Audience Persona</div>
                <div style={{ fontSize:"0.88rem", color:"#94a3b8", marginTop:2 }}>Unlock detailed audience demographics for your profile</div>
              </div>
            </div>
            <div style={{ height:1, background:"rgba(148,163,184,0.1)", marginBottom:24 }} />
            <div style={{ fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.12em", color:"#94a3b8", fontWeight:600, marginBottom:16 }}>
              Requirements to unlock
            </div>

            {/* Requirement 1 — Business/Creator account */}
            <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:14, background: isBusinessOrCreator ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${isBusinessOrCreator ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)"}`, borderRadius:12, padding:"16px 18px" }}>
              <div style={{ width:32, height:32, borderRadius:8, background: isBusinessOrCreator ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${isBusinessOrCreator ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {isBusinessOrCreator ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                )}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:"0.95rem", color:"#f1f5f9", marginBottom:4 }}>Instagram Business or Creator Account</div>
                <div style={{ fontSize:"0.85rem", color:"#94a3b8", lineHeight:1.6 }}>
                  Your account must be set to <strong style={{ color:"#f1f5f9" }}>Business</strong> or <strong style={{ color:"#f1f5f9" }}>Creator</strong> type.
                  {" "}{isBusinessOrCreator
                    ? <span style={{ color:"#4ade80" }}>✓ Account type confirmed: <strong style={{ color:"#4ade80" }}>Business / Creator</strong></span>
                    : <span style={{ color:"#f87171" }}>Personal accounts cannot access audience demographics</span>
                  }
                </div>
              </div>
              <div style={{ flexShrink:0, background: isBusinessOrCreator ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: isBusinessOrCreator ? "#4ade80" : "#f87171", fontSize:"0.72rem", fontWeight:600, padding:"3px 10px", borderRadius:99, border: `1px solid ${isBusinessOrCreator ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.2)"}`, whiteSpace:"nowrap" }}>
                {isBusinessOrCreator ? "✓ Met" : "Not Met"}
              </div>
            </div>

            {/* Requirement 2 — 100+ followers */}
            <div style={{ display:"flex", alignItems:"flex-start", gap:14, background: hasEnoughFollowers ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${hasEnoughFollowers ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)"}`, borderRadius:12, padding:"16px 18px" }}>
              <div style={{ width:32, height:32, borderRadius:8, background: hasEnoughFollowers ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${hasEnoughFollowers ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {hasEnoughFollowers ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                )}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:"0.95rem", color:"#f1f5f9", marginBottom:4 }}>100+ Followers</div>
                <div style={{ fontSize:"0.85rem", color:"#94a3b8", lineHeight:1.6 }}>
                  Instagram requires at least <strong style={{ color:"#f1f5f9" }}>100 followers</strong> before audience demographic data is available.
                  {" "}{hasEnoughFollowers
                    ? <span style={{ color:"#4ade80" }}>✓ You have <strong style={{ color:"#4ade80" }}>{followersCount.toLocaleString()} followers</strong></span>
                    : <span style={{ color:"#f87171" }}>You currently have <strong style={{ color:"#f87171" }}>{followersCount.toLocaleString()} followers</strong> — need {Math.max(0, 100 - followersCount)} more</span>
                  }
                </div>
              </div>
              <div style={{ flexShrink:0, background: hasEnoughFollowers ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: hasEnoughFollowers ? "#4ade80" : "#f87171", fontSize:"0.72rem", fontWeight:600, padding:"3px 10px", borderRadius:99, border: `1px solid ${hasEnoughFollowers ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.2)"}`, whiteSpace:"nowrap" }}>
                {hasEnoughFollowers ? "✓ Met" : "Not Met"}
              </div>
            </div>

            <div style={{ marginTop:20, display:"flex", alignItems:"center", gap:10, background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.15)", borderRadius:10, padding:"12px 16px" }}>
              <span style={{ fontSize:"1rem", flexShrink:0 }}>💡</span>
              <span style={{ fontSize:"0.88rem", color:"#94a3b8", lineHeight:1.6 }}>
                Once both requirements are met, this section will automatically show Age Groups, Gender Split, Top Cities, Top Countries and Active Hours — all pulled live from the Instagram API.
              </span>
            </div>
          </div>
        </Card>
      )}

      {audienceData === "done" && audienceAPI && (
        <Card>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <CardTitle dotColor="#ec4899">Who Is Your Audience?</CardTitle>
            <span style={{ fontSize:"0.8rem", padding:"3px 12px", borderRadius:99, background:"rgba(34,197,94,0.12)", color:"#4ade80", border:"1px solid rgba(34,197,94,0.3)", fontWeight:600 }}>
              ✓ Live Data
            </span>
          </div>

          {/* FIX 2: grid div properly closed, Card properly closed */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:30 }}>
            {audienceAPI.age_groups?.length > 0 && (
              <div>
                <p style={{ fontSize:"0.92rem", color:"#94a3b8", marginBottom:12 }}>Age Groups</p>
                {audienceAPI.age_groups.map((a) => <PBarRow key={a.label} label={a.label} pct={a.pct} color={a.color} />)}
              </div>
            )}
            {audienceAPI.gender_split?.length > 0 && (
              <div>
                <p style={{ fontSize:"0.92rem", color:"#94a3b8", marginBottom:12 }}>Gender Split</p>
                {audienceAPI.gender_split.map((g) => <PBarRow key={g.label} label={g.label} pct={g.pct} color={g.color} />)}
              </div>
            )}
            {audienceAPI.top_cities?.length > 0 && (
              <div>
                <p style={{ fontSize:"0.92rem", color:"#94a3b8", marginBottom:12 }}>Top Cities</p>
                {audienceAPI.top_cities.map((c) => <PBarRow key={c.label} label={c.label} pct={c.pct} color={c.color} />)}
              </div>
            )}
            {audienceAPI.top_countries?.length > 0 && (
              <div>
                <p style={{ fontSize:"0.92rem", color:"#94a3b8", marginBottom:12 }}>Top Countries</p>
                {audienceAPI.top_countries.map((c) => <PBarRow key={c.label} label={c.label} pct={c.pct} color={c.color} />)}
              </div>
            )}
            {audienceAPI.active_hours?.length > 0 && (
              <div>
                <p style={{ fontSize:"0.92rem", color:"#94a3b8", marginBottom:12 }}>Active Hours</p>
                {audienceAPI.active_hours.map((h) => <PBarRow key={h.label} label={h.label} pct={h.pct} color={h.color} />)}
              </div>
            )}
            <div>
              <p style={{ fontSize:"0.92rem", color:"#94a3b8", marginBottom:12 }}>Best Engagement Days</p>
              {dayActivityData.slice(0,5).map((a) => <PBarRow key={a.label} {...a} />)}
            </div>
          </div>
        </Card>
      )}

      {/* ══════ 5. CONTENT CALENDAR ══════ */}
      <SectionLabel>✦ Suggested Content Calendar (This Week)</SectionLabel>
      <Card>
        <CardTitle dotColor="#14b8a6">When & What to Post Next</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10 }}>
          {calSlots.map((slot) => {
            const sc = slotColors[slot.type];
            const IconComp = slot.Icon;
            return (
              <div key={slot.day} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"0.92rem", color:"#94a3b8", marginBottom:7, textTransform:"uppercase" }}>
                  {slot.day}{slot.isBest?" ⭐":""}
                </div>
                <div style={{ height:78, borderRadius:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, background:sc.bg, border:`1px solid ${sc.border}`, color:sc.color, opacity:slot.type==="rest"?0.55:1 }}>
                  <IconComp size={22} color={sc.color} strokeWidth={1.8} />
                  <span style={{ fontSize:"0.92rem", fontWeight:500 }}>{slot.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:18, marginTop:16, flexWrap:"wrap" }}>
          {[["#4ade80","Best Day"],["#60a5fa","Post Reel"],["#fb923c","Post Feed"],["#94a3b8","Rest Day"]].map(([c,l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:7, fontSize:"1rem", color:"#94a3b8" }}>
              <div style={{ width:9, height:9, borderRadius:2, background:c }} />{l}
            </div>
          ))}
        </div>
      </Card>

{/* ══════ 6. INDUSTRY BENCHMARK ══════ */}
      <SectionLabel>✦ Industry Benchmark Comparison</SectionLabel>
      <Card>
        <CardTitle dotColor="#ef4444">You vs Industry Average</CardTitle>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                {["Account","Avg Reach","Engagement Rate","Posts / Week","Sentiment"].map((h) => (
                  <th key={h} style={{ fontSize:"0.92rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"#94a3b8", padding:"10px 14px", textAlign:"left", borderBottom:"1px solid rgba(148,163,184,0.1)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label:"You",              tag:true,  reach:myReach, eng:`${myEngRate}%`, freq:myFreq, sent:mySent },
                { label:"Industry Avg",     tag:false, reach:8200,    eng:"3.8%",          freq:"4.5",  sent:"68% Positive" },
                { label:"Top 10% Creators", tag:false, reach:45000,   eng:"9.2%",          freq:"6.0",  sent:"91% Positive" },
              ].map((row) => (
                <tr key={row.label} style={row.tag?{background:"rgba(249,115,22,0.08)"}:{}}>
                  <td style={{ padding:"14px", fontSize:"0.95rem", color:"#f1f5f9", borderBottom:"1px solid rgba(255,255,255,0.04)", borderLeft:row.tag?"2px solid #f97316":"none" }}>
                    <strong>{row.label}</strong>
                    {row.tag && <span style={{ marginLeft:8, background:"rgba(249,115,22,0.15)", color:"#fb923c", fontSize:"0.85rem", padding:"2px 8px", borderRadius:99, border:"1px solid rgba(249,115,22,0.3)" }}>@{profile.username}</span>}
                  </td>
                  <td style={{ padding:"14px", fontSize:"0.95rem", color:"#f1f5f9", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    {typeof row.reach==="number"?row.reach.toLocaleString():row.reach}
                  </td>
                  <td style={{ padding:"14px", fontSize:"0.95rem", borderBottom:"1px solid rgba(255,255,255,0.04)", color:row.tag?(Number(myEngRate)>3.8?"#22c55e":"#ef4444"):"#f1f5f9" }}>
                    {row.tag?(Number(myEngRate)>3.8?"↑ ":"↓ "):""}{row.eng}
                  </td>
                  <td style={{ padding:"14px", fontSize:"0.95rem", color:"#f1f5f9", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>{row.freq}</td>
                  <td style={{ padding:"14px", fontSize:"0.95rem", borderBottom:"1px solid rgba(255,255,255,0.04)", color:row.tag?(sentimentPct>68?"#22c55e":"#f97316"):"#f1f5f9" }}>{row.sent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop:14, fontSize:"0.95rem", color:"#94a3b8" }}>
          💡 You're doing great just keep posting more consistently could push you into the Top 10%.
        </p>
      </Card>

      <div style={{ height:40 }} />
    </div>
  );
}