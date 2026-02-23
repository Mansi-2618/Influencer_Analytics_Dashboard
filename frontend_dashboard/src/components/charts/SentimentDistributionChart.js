import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { Heart } from "lucide-react";

export default function SentimentDistributionChart({ summary }) {
  if (
    !summary ||
    summary["positive_percent"] == null ||
    summary["neutral_percent"] == null ||
    summary["negative_percent"] == null
  ) {
    return (
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg" style={{ height: 380 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-pink-500/10 rounded-xl">
            <Heart className="w-6 h-6 text-pink-400" strokeWidth={2.5} />
          </div>
          <h3 className="text-md font-bold text-white">
            Overall Audience Sentiment
          </h3>
        </div>
        <p className="text-slate-400 text-center py-8">Sentiment data not available</p>
      </div>
    );
  }

  const data = [
    { name: "Positive", value: summary["positive_percent"] },
    { name: "Neutral", value: summary["neutral_percent"] },
    { name: "Negative", value: summary["negative_percent"] },
  ];

  const COLORS = {
    Positive: '#10b981',  // green
    Neutral: '#f59e0b',   // amber
    Negative: '#ef4444',  // red
  };

  // Custom label
  const renderLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 35;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#e2e8f0"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={15}
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font mb-1">{payload[0].name}</p>
          <p className="text-orange-400 font text-lg">
            {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xl">🫀</span>
        <h3 className="text-xl font text-white">
          Overall Audience Sentiment
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={105}
            labelLine={{
              stroke: '#97a6ba',
              strokeWidth: 1,
            }}
            label={renderLabel}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name]}
                stroke="#1e293b"
                strokeWidth={2}
              />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <p className="text-green-400 text-xl font-bold">
            {summary["positive_percent"]}%
          </p>
          <p className="text-slate-300 text-sm mt-1">Positive</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="text-amber-400 text-xl font-bold">
            {summary["neutral_percent"]}%
          </p>
          <p className="text-slate-300 text-sm mt-1">Neutral</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-xl font-bold">
            {summary["negative_percent"]}%
          </p>
          <p className="text-slate-300 text-sm mt-1">Negative</p>
        </div>
      </div>
    </div>
  );
}