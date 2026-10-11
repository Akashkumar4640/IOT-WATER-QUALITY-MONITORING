import React, { useState, useEffect } from 'react';
import { useHardware } from '../context/HardwareContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  WifiOff,
  Clock,
  Trash2,
  Check,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import type { AlertItem } from '../types';

export const AlertsPage: React.FC = () => {
  const { activeDeviceId, refreshAlerts } = useHardware();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterResolved, setFilterResolved] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const loadAlerts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { deviceId: activeDeviceId };
      if (filterResolved === 'ACTIVE') params.resolved = false;
      else if (filterResolved === 'RESOLVED') params.resolved = true;
      if (filterSeverity !== 'ALL') params.severity = filterSeverity;

      const res = await api.getAlerts(params);
      if (res.success && res.data) {
        setAlerts(res.data);
      } else {
        const errObj = res.error;
        setError(typeof errObj === 'string' ? errObj : errObj?.message || 'Failed to load alerts');
      }
    } catch (e: any) {
      setError(e.message || 'Error loading alerts');
    } finally {
      setLoading(false);
    }
  }, [activeDeviceId, filterResolved, filterSeverity]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleResolve = async (id: number) => {
    setIsProcessing(true);
    try {
      await api.resolveAlert(id);
      await loadAlerts();
      await refreshAlerts();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearResolved = async () => {
    setIsProcessing(true);
    try {
      await api.clearAlerts(activeDeviceId);
      await loadAlerts();
      await refreshAlerts();
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-glow-rose flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> WARNING
          </span>
        );
      case 'HARDWARE':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
            HARDWARE
          </span>
        );
      case 'CONNECTION':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5" /> OFFLINE
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> RESOLVED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Real-Time Alert Engine & Anomaly Logs
          </h2>
          <p className="text-xs text-slate-400">
            Automated threshold violation evaluation, deduplicated notifications, and system faults
          </p>
        </div>

        <button
          onClick={handleClearResolved}
          disabled={isProcessing}
          className="px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60 text-xs font-medium flex items-center space-x-1.5 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Clear Resolved</span>
        </button>
      </div>

      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> State:
          </span>
          {(['ACTIVE', 'RESOLVED', 'ALL'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterResolved(s)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterResolved === s
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 bg-dark-900/60'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Severity:</span>
          {['ALL', 'CRITICAL', 'WARNING', 'CONNECTION'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === sev
                  ? 'bg-slate-800 text-white border border-slate-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <ErrorBoundary fallbackTitle="Unable to load Alerts List">
        <div className="space-y-3">
          {loading ? (
            <div className="glass-panel p-12 text-center text-slate-500 text-xs font-mono">
              Scanning alert pipeline...
            </div>
          ) : error ? (
            <div className="glass-panel p-10 text-center text-rose-400 text-xs space-y-2">
              <span>{error}</span>
              <div>
                <button
                  onClick={loadAlerts}
                  className="px-3 py-1.5 bg-dark-850 text-cyan-300 border border-slate-700 rounded-xl"
                >
                  Retry Loading
                </button>
              </div>
            </div>
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-8 h-8 text-emerald-400" />}
              title="No Active Alerts"
              description="All monitored water parameters are operating within standard configured thresholds."
              actionText="Scan Again"
              onAction={loadAlerts}
            />
          ) : (
            alerts.map((alert: AlertItem) => (
              <div
                key={alert.id}
                className={`glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-all ${
                  alert.resolved
                    ? 'border-slate-800/80 bg-dark-900/50 opacity-70'
                    : alert.severity === 'CRITICAL'
                    ? 'border-rose-500/40 bg-rose-950/20 shadow-glow-rose'
                    : 'border-amber-500/30 bg-amber-950/15'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="mt-0.5">{getSeverityBadge(alert.severity)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">{alert.sensor} Parameter Anomaly</h4>
                      <span className="text-[11px] font-mono text-slate-400">({alert.deviceId})</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                    <div className="flex items-center space-x-4 text-[10px] text-slate-500 mt-2 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(alert.timestamp).toLocaleString()}
                      </span>
                      <span>Threshold Trigger: {alert.threshold}</span>
                    </div>
                  </div>
                </div>

                {!alert.resolved ? (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={isProcessing}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all self-end md:self-center disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledge & Resolve</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-emerald-400 font-medium self-end md:self-center">
                    Resolved {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleTimeString() : ''}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
};

export const AlertsView = AlertsPage;
