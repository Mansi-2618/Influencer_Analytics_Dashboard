import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

import { Smile } from "lucide-react";

export default function MediaWiseSentimentTrendChart({ data }) {
  if (!data || !data.length) {
    return (
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">📈</span>
          <h3 className="text-xl font text-white">
            Media-wise Sentiment vs Overall Sentiment
          </h3>
        </div>
        <p className="text-slate-400 text-center py-8">No sentiment data available</p>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-semibold">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-rose-500/10 rounded-md">
          <Smile className="w-6 h-6 text-rose-400" strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font text-white">
          Media-wise Sentiment vs Overall Sentiment
        </h3>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
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
            dataKey="media_id"
            tick={false}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
          />

          {/* Left Y Axis - Media Sentiment */}
          <YAxis
            yAxisId="left"
            tick={{ fill: '#94a3b8', fontSize: 13 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: "Media Sentiment",
              angle: -90,
              dy:40,
              dx: -5,
              position: "insideLeft",
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />

          {/* Right Y Axis - Overall Sentiment */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#94a3b8', fontSize: 13 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: "Overall Sentiment",
              angle: 90,
              dy:45,
              dx: 0,
              position: "insideRight",
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />

          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} />

          {/* BAR → Per media sentiment */}
          <Bar
            yAxisId="left"
            dataKey="media_sentiment"
            name="Media Sentiment"
            fill="#ff8c00"
            radius={[5, 5, 0, 0]}
            barSize={40}
          />

          {/* LINE → Overall sentiment trend */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="overall_sentiment"
            name="Overall Sentiment"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}