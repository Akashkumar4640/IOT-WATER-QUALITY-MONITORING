import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SensorCardProps {
  name: string;
  value: number | null;
  unit: string;
  isConnected: boolean;
  minSafe?: number;
  maxSafe?: number;
  icon?: React.ReactNode;
  history?: number[];
  precision?: number;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  name,
  value,
  unit,
  isConnected,
  minSafe,
  maxSafe,
  icon,
  history = [],
  precision = 2
}) => {
  const [prevValue, setPrevValue] = useState<number | null>(value);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  useEffect(() => {
    if (value !== null && prevValue !== null && value !== prevValue) {
      if (value > prevValue) setTrend('up');
      else if (value < prevValue) setTrend('down');
      else setTrend('stable');

      setIsFlashing(true);
      const t = setTimeout(() => setIsFlashing(false), 800);
      setPrevValue(value);
      return () => clearTimeout(t);
    }
  }, [value, prevValue]);

  const isValidNumber = isConnected && value !== null && typeof value === 'number' && Number.isFinite(value);

  // Determine quality state
  let qualityStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'DISCONNECTED' = 'NORMAL';
  if (!isValidNumber) {
    qualityStatus = 'DISCONNECTED';
  } else if (minSafe !== undefined && maxSafe !== undefined) {
    if (value < minSafe || value > maxSafe) {
      qualityStatus = 'CRITICAL';
    } else if (value < minSafe * 1.05 || value > maxSafe * 0.95) {
      qualityStatus = 'WARNING';
    }
  }

  // Format mini chart data safely without NaN
  const validHistory = history.filter(v => typeof v === 'number' && Number.isFinite(v));
  const chartData = (validHistory.length > 0 ? validHistory : (isValidNumber ? [value, value, value] : [0, 0, 0])).map((val, idx) => ({
    i: idx,
    val: val
  }));

  const getStatusBadge = () => {
    if (qualityStatus === 'DISCONNECTED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          <HelpCircle className="w-3 h-3" /> Not Connected
        </span>
      );
    }
    if (qualityStatus === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
          <AlertCircle className="w-3 h-3" /> ABNORMAL
        </span>
      );
    }
    if (qualityStatus === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertCircle className="w-3 h-3" /> WARNING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
        <CheckCircle className="w-3 h-3" /> NORMAL
      </span>
    );
  };

  const getStrokeColor = () => {
    if (qualityStatus === 'CRITICAL') return '#f43f5e';
    if (qualityStatus === 'WARNING') return '#f59e0b';
    if (qualityStatus === 'DISCONNECTED') return '#475569';
    return '#06b6d4';
  };

  return (
    <div className={`glass-panel p-5 relative overflow-hidden transition-all duration-300 border ${
      isFlashing ? 'border-cyan-400/80 shadow-glow-cyan' : 'border-slate-800/80 hover:border-slate-700'
    }`}>
      {/* Top Row: Icon, Name & Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-dark-900/90 text-cyan-400 border border-slate-700/60">
            {icon}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-300 tracking-wide uppercase">{name}</h3>
            <span className="text-[10px] text-slate-400">
              {isConnected ? '🟢 Connected' : '⚪ Sensor Not Connected'}
            </span>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Value Display */}
      <div className="my-2 flex items-baseline justify-between">
        <div>
          {isConnected && value !== null ? (
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                {value.toFixed(precision)}
              </span>
              <span className="text-sm font-medium text-slate-400">{unit}</span>
            </div>
          ) : (
            <div className="py-2">
              <span className="text-lg font-semibold text-slate-400 font-mono">--</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Sensor Not Connected</p>
            </div>
          )}
        </div>

        {/* Trend Indicator */}
        {isConnected && value !== null && (
          <div className="flex items-center text-xs font-medium space-x-1 text-slate-400">
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-amber-400" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-cyan-400" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-slate-400" />}
            <span className="capitalize">{trend}</span>
          </div>
        )}
      </div>

      {/* Mini Sparkline Chart */}
      <div className="h-12 w-full mt-3 -mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${name.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getStrokeColor()} stopOpacity={0.4} />
                <stop offset="95%" stopColor={getStrokeColor()} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="val"
              stroke={getStrokeColor()}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#grad-${name.replace(/\s+/g, '')})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Safe benchmark range footnote */}
      {minSafe !== undefined && maxSafe !== undefined && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span>Safe Range: {minSafe} – {maxSafe} {unit}</span>
          <span>Target Optimal</span>
        </div>
      )}
    </div>
  );
};
