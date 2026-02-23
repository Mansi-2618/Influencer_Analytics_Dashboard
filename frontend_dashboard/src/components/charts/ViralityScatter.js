import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ZAxis,
} from "recharts";

import { Flame } from "lucide-react";

export default function ViralityScatter({ data }) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm mb-2">
            {payload[0].payload.media_id?.substring(0, 15)}...
          </p>
          <p className="text-white font">
            Reach: <span className="text-orange-400">{payload[0].value.toLocaleString()}</span>
          </p>
          <p className="text-white font">
            Virality: <span className="text-orange-400">{payload[1].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{height:380}}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-red-500/10 rounded-md">
          <Flame className="w-6 h-6 text-red-400" strokeWidth={2.5} />
        </div>
        <h5 className="text-lg font text-white">
          Content Reach & its Virality Score
        </h5>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
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
            dataKey="reach" 
            name="Reach"
            type="number"
            tick={false}
            axisLine={{ stroke: '#475569' }}
            tickLine={false}
            label={{
              value: "Reach",
              position: "insideBottom",
              offset: 5,
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />
          
          {/* Y Axis */}
          <YAxis
            dataKey="viral_potential_score"
            name="Viral Potential"
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 13 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: "Virality Score",
              angle: -90,
              dy:25,
              dx:-5,
              position: "insideLeft",
              style: { fill: '#94a3b8', fontSize: 15 }
            }}
          />
          
          {/* Z Axis for bubble size */}
          <ZAxis range={[60, 400]} />
          
          {/* Tooltip */}
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: "3 3", stroke: "#475569" }} 
          />
          
          {/* Scatter points */}
          <Scatter
            data={data}
            fill="#ff8c00"
            fillOpacity={0.8}
            stroke="#fff"
            strokeWidth={1}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}