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

import { Anchor } from "lucide-react";

export default function HookEfficiencyChart({ data }) {
  if (!data?.length) return null;

  // Generate gradient colors based on efficiency
  const getColor = (value) => {
    if (value >= 80) return '#10b981'; // green - excellent
    if (value >= 60) return '#3b82f6'; // blue - good
    if (value >= 40) return '#f59e0b'; // amber - okay
    return '#ef4444'; // red - needs improvement
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const efficiency = payload[0].value;
      let grade = 'Needs Work';
      if (efficiency >= 80) grade = 'Excellent';
      else if (efficiency >= 60) grade = 'Good';
      else if (efficiency >= 40) grade = 'Okay';

      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-xs mb-2">
            {payload[0].payload.media_id}
          </p>
          <p className="text-white font-bold text-lg mb-1">
            {efficiency}% Efficiency
          </p>
          <p className="text-sm" style={{ color: getColor(efficiency) }}>
            {grade}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{height:380}}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-green-500/10 rounded-md">
          <Anchor className="w-6 h-6 text-green-400" strokeWidth={2.5} />
        </div>
        <h5 className="text-lg font text-white">
          Hook Efficiency Distribution
        </h5>
      </div>

      <ResponsiveContainer width="100%" height="78%">
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
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />

          {/* Y Axis */}
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 13 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: "Hook Efficiency %",
              angle: -90,
              dy: 40,
              dx: -5,
              position: "insideLeft",
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />

          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} />

          {/* Bars with conditional colors */}
          <Bar
            dataKey="hook_efficiency"
            radius={[8, 8, 0, 0]}
            barSize={40}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getColor(entry.hook_efficiency)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
          <span className="text-slate-300">0-40% (Needs Work)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
          <span className="text-slate-300">40-60% (Okay)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
          <span className="text-slate-300">60-80% (Good)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
          <span className="text-slate-300">80-100% (Excellent)</span>
        </div>
      </div>
    </div>
  );
}