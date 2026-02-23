import MetricCard from "./MetricCard";

export default function MetricsRow({ profile }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <MetricCard 
        label="Followers" 
        value={profile.followers?.toLocaleString() || 0}
      />
      <MetricCard 
        label="Reach" 
        value={profile.reach?.toLocaleString() || 0}
      />
      <MetricCard 
        label="Profile Views" 
        value={profile.profile_views?.toLocaleString() || 0}
      />
      <MetricCard 
        label="Website Clicks" 
        value={profile.website_clicks?.toLocaleString() || 0}
      />
    </div>
  );
}