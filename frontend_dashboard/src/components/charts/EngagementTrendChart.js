import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { Activity } from "lucide-react";

export default function EngagementTrendChart({ data }) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm mb-1">{payload[0].payload.date}</p>
          <p className="text-orange-400 font-bold text-lg">
            {payload[0].value.toLocaleString()} Engagement
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-500/10 rounded-md">
          <Activity className="w-6 h-6 text-blue-400" strokeWidth={2.5} />
        </div>
        <h5 className="text-lg font text-white">
          Audience Engagement Over Time
        </h5>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
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
            dataKey="date"
            tick={false}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
            label={{
              value: "Timeline",
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
              value: "Engagement",
              angle: -90,
              dy:20,
              position: "insideLeft",
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />
          
          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} />
          
          {/* Area with gradient */}
          <defs>
            <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff8c00" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ff8c00" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          
          <Area
            type="monotone"
            dataKey="engagement"
            stroke="#ff8c00"
            fill="url(#engagementGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}