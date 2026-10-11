import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface SensorHistoryChartProps {
  data: Array<{
    time: string;
    value: number | null;
    [key: string]: any;
  }>;
  dataKey?: string;
  unit?: string;
  color?: string;
  isLoading?: boolean;
}

export const SensorHistoryChart: React.FC<SensorHistoryChartProps> = ({
  data,
  dataKey = 'value',
  unit = '',
  color = '#22d3ee',
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500 font-mono">
        Loading historical trend...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500">
        No historical data logged for selected time range.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} unit={unit ? ` ${unit}` : ''} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
            labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
            formatter={(value: any) => [`${value} ${unit}`, dataKey.toUpperCase()]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
