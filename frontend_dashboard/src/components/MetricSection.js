import MetricCard from "./MetricCard";

export default function MetricSection({ title, metrics, icon: Icon, iconColor= "text-pink-400", titleColor = "text-white" }) {
  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-3">
      {/* ICON */}
        {Icon && (
          <Icon className={`w-6 h-8 stroke-[3] ${iconColor}`} />
        )}

        <h3 className={`text-xl lg:text-2xl font-bold ${titleColor}`}>
          {title}
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent"></div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {metrics.map((m, idx) => (
          <MetricCard
            key={idx}
            label={m.label}
            value={m.value}
            icon={m.icon}
            trend={m.trend}
            trendPositive={m.trendPositive}
          />
        ))}
      </div>
    </div>
  );
}