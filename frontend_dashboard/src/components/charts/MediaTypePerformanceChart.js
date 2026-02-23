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

import { BarChart3 } from "lucide-react";

export default function MediaTypePerformanceChart({ data }) {
  // Colors for different media types
  const COLORS = {
    'REELS': '#ff8c00', // amber
    'FEED': '#3b82f6',  // blue
    'STORY': '#10b981', // green
    'VIDEO': '#a855f7', // purple
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-bold mb-2">{payload[0].payload.media_type}</p>
          <p className="text-orange-400 font-bold text-lg">
            {payload[0].value}% Reach
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-purple-500/10 rounded-md">
          <BarChart3 className="w-6 h-6 text-purple-400" strokeWidth={2.5} />
        </div>
        <h5 className="text-lg font text-white">
          Media Type Performance
        </h5>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 10,    
            bottom: 40,
          }}
        >
          {/* Grid */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(148, 163, 184, 0.1)"
          />
          
          {/* X Axis */}
          <XAxis 
            dataKey="media_type" 
            tick={false}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
            label={{
              value: "Media Type",
              position: "insideBottom",
              offset: 5,
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />
          
          {/* Y Axis */}
          <YAxis 
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#94a3b8', fontSize: 13 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: "Reach %",
              angle: -90,
              dx:-10,
              dy:20,
              position: "insideLeft",
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />
          
          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} />
          
          {/* Bars with different colors */}
          <Bar
            dataKey="reach_percent"
            radius={[8, 8, 0, 0]}
            barSize={80}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.media_type] || '#ff8c00'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}