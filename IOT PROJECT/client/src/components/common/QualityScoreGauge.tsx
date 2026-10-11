import React from 'react';
import { ShieldCheck, AlertTriangle, XOctagon, HelpCircle, Info } from 'lucide-react';
import type { WQIResult } from '../../types';

interface QualityScoreGaugeProps {
  wqi: WQIResult | null;
}

export const QualityScoreGauge: React.FC<QualityScoreGaugeProps> = ({ wqi }) => {
  const score = wqi?.score ?? null;
  const status = wqi?.status ?? 'UNAVAILABLE';

  const getColorClasses = () => {
    switch (status) {
      case 'GOOD':
        return {
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          glow: 'shadow-glow-emerald',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
        };
      case 'WARNING':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
        };
      case 'CRITICAL':
        return {
          text: 'text-rose-400',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          glow: 'shadow-glow-rose',
          icon: <XOctagon className="w-5 h-5 text-rose-400" />
        };
      default:
        return {
          text: 'text-slate-400',
          bg: 'bg-slate-800/40',
          border: 'border-slate-700/50',
          glow: '',
          icon: <HelpCircle className="w-5 h-5 text-slate-400" />
        };
    }
  };

  const style = getColorClasses();

  return (
    <div className={`glass-panel p-6 border ${style.border} ${style.glow} relative overflow-hidden`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                className="text-slate-800"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                className={style.text}
                strokeWidth="8"
                strokeDasharray={301.59}
                strokeDashoffset={score !== null ? 301.59 - (301.59 * score) / 100 : 301.59}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black font-mono tracking-tight text-white">
                {score !== null ? score : '--'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                / 100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                CURRENT WATER QUALITY
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${style.bg} ${style.text} border ${style.border}`}>
                {style.icon}
                {status}
              </span>
            </div>

            <h2 className="text-lg font-bold text-white mb-1">
              {status === 'GOOD' && 'Optimal Water Parameter Quality'}
              {status === 'WARNING' && 'Parameter Threshold Advisory'}
              {status === 'CRITICAL' && 'Critical Water Quality Anomaly'}
              {status === 'UNAVAILABLE' && 'Awaiting Active Sensor Data'}
            </h2>

            <p className="text-xs text-slate-300 max-w-xl">
              {wqi?.message || 'Measured parameters are currently within the configured limits.'}
            </p>
          </div>
        </div>

        <div className="bg-dark-900/80 p-3.5 rounded-xl border border-slate-800/80 max-w-sm text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Monitored Evaluation Benchmark</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Score calculated dynamically from active sensors ({wqi?.activeSensors ?? 0} connected). This system is a real-time monitoring and analysis tool, not a laboratory certification system.
          </p>
        </div>
      </div>
    </div>
  );
};
