import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { Repeat } from "lucide-react";

export default function RewatchRatioChart({ data }) {
  if (!data?.length) return null;

  // Color based on rewatch ratio
  const getColor = (value) => {
    if (value >= 1.5) return '#10b981'; // green - high rewatch
    if (value >= 1.0) return '#3b82f6'; // blue - good
    if (value >= 0.5) return '#f59e0b'; // amber - moderate
    return '#ef4444'; // red - low
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const ratio = payload[0].value;
      let status = 'Low Rewatches';
      if (ratio >= 1.5) status = 'High Rewatches';
      else if (ratio >= 1.0) status = 'Good Rewatches';
      else if (ratio >= 0.5) status = 'Moderate Rewatches';

      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm mb-2">
            {payload[0].payload.media_id}
          </p>
          <p className="text-white font text-lg mb-1">
            {ratio.toFixed(2)}
          </p>
          <p className="text-sm" style={{ color: getColor(ratio) }}>
            {status}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{height:380}}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-cyan-500/10 rounded-md">
          <Repeat className="w-6 h-6 text-cyan-400" strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font text-white">
          Rewatch Ratio by Content
        </h3>
      </div>

      <ResponsiveContainer width="100%" height="76%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
        >
          {/* Grid */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(148, 163, 184, 0.1)"
          />
          
          {/* X Axis */}
          <XAxis
            dataKey="media_id"
            tick={false}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
            label={{
              value: "Media ID",
              position: "insideBottom",
              offset: 5,
              style: { fill: '#94a3b8', fontSize: 15}
            }}
          />
          
          {/* Y Axis */}
          <YAxis
            domain={[0, "auto"]}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: "Rewatch Ratio",
              angle: -90,
              dy: 40,
              dx: -5,
              position: "insideLeft",
              style: { fill: '#94a3b8', fontSize: 15}
            }}
          />
          
          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} />
          
          {/* Bars - Lollipop style */}
          <Bar
            dataKey="rewatch_ratio"
            barSize={8}
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getColor(entry.rewatch_ratio)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
          <span className="text-slate-300">{'<0.5 (Low)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
          <span className="text-slate-300">0.5-1.0 (Moderate)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
          <span className="text-slate-300">1.0-1.5 (Good)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
          <span className="text-slate-300">{'>1.5 (High)'}</span>
        </div>
      </div>
    </div>
  );
}