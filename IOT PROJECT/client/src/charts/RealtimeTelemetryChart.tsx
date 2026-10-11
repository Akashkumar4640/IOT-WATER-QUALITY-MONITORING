import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface RealtimeTelemetryChartProps {
  data: Array<{
    time: string;
    [key: string]: any;
  }>;
  selectedSensor: string;
  strokeColor?: string;
  isLoading?: boolean;
}

export const RealtimeTelemetryChart: React.FC<RealtimeTelemetryChartProps> = ({
  data,
  selectedSensor,
  strokeColor = '#22d3ee',
  isLoading = false
}) => {
  if (isLoading && data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
        Loading telemetry stream...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-slate-500">
        No telemetry stream data available yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.slice(-25)}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
        <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
          labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
        />
        <Line
          type="monotone"
          dataKey={selectedSensor}
          stroke={strokeColor}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: strokeColor }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
