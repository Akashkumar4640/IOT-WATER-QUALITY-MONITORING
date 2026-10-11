import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

interface ParameterDistributionProps {
  parameters: Array<{
    name: string;
    score: number;
    color: string;
    unit: string;
  }>;
}

export const ParameterDistributionChart: React.FC<ParameterDistributionProps> = ({ parameters }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={parameters} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
          <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
            labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
            formatter={(val: any) => [`${val}% Quality Index`, 'Index']}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]}>
            {parameters.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
