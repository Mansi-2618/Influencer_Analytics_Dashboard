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

import { MessageCircle } from "lucide-react";

export default function TopCommentersChart({ data }) {
  if (!data.length) {
    return (
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg" style={{height:380}}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">💬</span>
          <h3 className="text-xl font text-white">
            Top Commenters
          </h3>
        </div>
        <p className="text-slate-400 text-center py-8">No comment data available</p>
      </div>
    );
  }

  // Generate colors - gradient from orange to lighter orange
  const generateColor = (index, total) => {
    const intensity = 1 - (index / total) * 0.5; // 100% to 50%
    return `rgba(255, 140, 0, ${intensity})`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-bold mb-1">@{payload[0].payload.username}</p>
          <p className="text-orange-400 font text-lg">
            {payload[0].value} comments
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{height:350}}>
      <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-md">
            <MessageCircle className="w-6 h-6 text-amber-400" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font text-white">
            Top Commenters
          </h3>
        </div>
      <ResponsiveContainer width="100%" height="95%">
        <BarChart data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 65 }}
          layout="horizontal"
        >
          {/* Grid */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(148, 163, 184, 0.1)"
          />

          {/* X Axis - Usernames */}
          <XAxis
            dataKey="username"
            tick={{ fill: '#c8d5e8', fontSize: 15 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: "Username",
              position: "insideBottom",
              offset: -20,
              style: { fill: '#94a3b8', fontSize: 16 }
            }}
          />
          
          {/* Y Axis - Comment Count */}
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 13 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: "Comments Count",
              angle: -90,
              dy: 50,
              dx: 0,
              position: "insideLeft",
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />
          
          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} />

          {/* Bars with gradient colors */}
          <Bar
            dataKey="count"
            radius={[8, 8, 0, 0]}
            barSize={50}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={generateColor(index, data.length)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}