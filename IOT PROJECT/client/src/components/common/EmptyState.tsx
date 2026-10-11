import React from 'react';
import { HelpCircle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div className={`glass-panel p-10 text-center border-slate-800/80 my-4 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-dark-850 text-slate-400 border border-slate-700/60 flex items-center justify-center mx-auto mb-3">
        {icon || <HelpCircle className="w-6 h-6 text-slate-400" />}
      </div>
      <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
      <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-3.5 py-1.5 rounded-xl bg-dark-850 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
