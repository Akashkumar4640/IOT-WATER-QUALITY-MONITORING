import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; height?: string; className?: string }> = ({
  rows = 1,
  height = 'h-24',
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`glass-panel p-4 ${height} animate-pulse bg-slate-800/40 border border-slate-700/40 rounded-2xl flex items-center justify-center`}
        >
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Loading telemetry data...</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-panel p-5 animate-pulse border border-slate-800/80 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-slate-800"></div>
          <div className="h-3 w-20 bg-slate-800 rounded"></div>
        </div>
        <div className="h-4 w-16 bg-slate-800 rounded-full"></div>
      </div>
      <div className="h-8 w-24 bg-slate-800 rounded my-3"></div>
      <div className="h-10 w-full bg-slate-800/60 rounded"></div>
    </div>
  );
};
