import { Bell } from "lucide-react";

export default function AlertsPanel({ alerts }) {
  const styles = {
    success: "bg-green-500/10 text-green-400 border-green-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    critical: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  const icons = {
    success: "✅",
    warning: "⚠️",
    critical: "🚨",
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <h3 className="text-white font-semibold">All Clear!</h3>
            <p className="text-slate-400 text-md">No alerts or recommendations at this time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <details
      open
      className="group rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-lg"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-white hover:bg-slate-700/30 rounded-t-2xl transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-md">
            <Bell className="w-6 h-6 text-amber-400" strokeWidth={2} />
          </div>
          <span className="text-lg">Alerts & Recommendations</span>
          <span className="px-2.5 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-xs font-bold">
            {alerts.length}
          </span>
        </div>

        {/* Dropdown Arrow */}
        <span className="text-slate-400 transition-transform duration-200 group-open:rotate-180">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </summary>

      <div className="px-6 pb-6 pt-2 space-y-3">
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className={`relative border-l-4 rounded-lg p-4 ${styles[alert.level]} backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:translate-x-1`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <span className="text-xl flex-shrink-0 mt-0.5">
                {icons[alert.level]}
              </span>
              
              {/* Message */}
              <div className="flex-1">
                <p className="text-md leading-relaxed font-medium">
                  {alert.message}
                </p>
              </div>
            </div>

            {/* Priority Indicator */}
            {alert.level === 'critical' && (
              <div className="absolute top-2 right-2">
                <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs font-bold uppercase">
                  High Priority
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}