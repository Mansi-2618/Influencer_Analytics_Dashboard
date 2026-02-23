export default function MetricCard({ label, value, icon, trend, trendPositive }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-transparent transition-all duration-300"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon & Label */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-md font-medium text-slate-200 uppercase tracking-wider">
            {label}
          </p>
          {icon && (
            <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
              {icon}
            </span>
          )}
        </div>

        {/* Value */}
        <p className="text-3xl font-bold text-white mb-2 font-sans">
          {value}
        </p>

        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center gap-1">
            <span className={`text-sm font-semibold ${
              trendPositive 
                ? 'text-green-400' 
                : 'text-red-400'
            }`}>
              {trendPositive ? '↗' : '↘'} {trend}
            </span>
            <span className="text-xs text-slate-500">vs last week</span>
          </div>
        )}
      </div>

      {/* Left Border Accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
}