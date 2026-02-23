import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { TrendingUp } from "lucide-react";

export default function ReachTrendChart({ data }) {
  // Custom tooltip for dark theme
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm mb-1">{payload[0].payload.date}</p>
          <p className="text-orange-400 font-bold text-lg">
            {payload[0].value.toLocaleString()} Reach
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ height: 380 }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-orange-500/10 rounded-md">
          <TrendingUp className="w-6 h-6 text-orange-400" strokeWidth={2.5} />
        </div>
        <h5 className="text-lg font text-white">
          Audience Reach Trend
        </h5>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 10,    
            bottom: 40,
          }}
        >
          {/* Grid with dark theme */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(148, 163, 184, 0.1)"
          />
          
          {/* X Axis */}
          <XAxis 
            dataKey="date"
            tick={false}          
            axistitle={true}
            axisLine={{ stroke: '#475569' }}
            label={{
              value: "Timeline",
              position: "insideBottom",
              offset: 3,
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />
          
          {/* Y Axis */}
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 13 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: "Reach",
              angle: -90,
              position: "insideLeft",
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />
          
          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} />
          
          {/* Line with gradient */}
          <Line
            type="monotone"
            dataKey="reach"
            stroke="#ff8c00"
            strokeWidth={2}
            dot={{ fill: '#ff8c00', strokeWidth: 1, r: 4, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#ff8c00', stroke: '#fff', strokeWidth: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}