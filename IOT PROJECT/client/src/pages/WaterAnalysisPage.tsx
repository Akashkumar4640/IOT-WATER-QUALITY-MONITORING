import React, { useState, useEffect } from 'react';
import { useHardware } from '../context/HardwareContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import {
  Droplets,
  CheckCircle2,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { api } from '../services/api';

export const WaterAnalysisPage: React.FC = () => {
  const { activeDeviceId, latestReading } = useHardware();
  const [stats, setStats] = useState<any>({ min: null, max: null, avg: null, count: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [calStatus, setCalStatus] = useState<string>('Factory Default');
  const [loading, setLoading] = useState<boolean>(true);

  const currentPH = latestReading?.ph ?? null;
  const isConnected = currentPH !== null && currentPH !== undefined;
  const minSafe = 6.5;
  const maxSafe = 8.5;
  const isAbnormal = isConnected && (currentPH < minSafe || currentPH > maxSafe);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await api.getHistory(activeDeviceId, '1h', 50);
        if (isMounted && res.success) {
          setStats(res.stats?.ph || { min: null, max: null, avg: null, count: 0 });
          const formatted = (res.data || []).map((r: any) => {
            const dateObj = r.timestamp ? new Date(r.timestamp.endsWith('Z') || r.timestamp.includes('T') ? r.timestamp : r.timestamp.replace(' ', 'T') + 'Z') : new Date();
            return {
              time: isNaN(dateObj.getTime()) ? '--:--:--' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              ph: r.ph
            };
          });
          setHistory(formatted);
        }

        const calRes = await api.getCalibration(activeDeviceId);
        if (isMounted && calRes.success && calRes.data) {
          const phCal = calRes.data.find((c: any) => c.sensor === 'pH');
          if (phCal) setCalStatus(`Calibrated (${new Date(phCal.calibrationDate).toLocaleDateString()})`);
        }
      } catch (e) {
        console.warn('pH Analysis data load failed:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeDeviceId]);

  // Reactive append from real-time reading
  useEffect(() => {
    if (!latestReading || latestReading.ph === null || latestReading.ph === undefined || !latestReading.timestamp) return;

    const timeStr = new Date(latestReading.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    setHistory((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
        return prev;
      }
      return [...prev, { time: timeStr, ph: latestReading.ph }].slice(-50);
    });
  }, [latestReading]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            Dedicated pH Water Quality Analysis Module
          </h2>
          <p className="text-xs text-slate-400">
            Precision hydrogen-ion chemical equilibrium monitoring and anomaly detection
          </p>
        </div>
      </div>

      {isAbnormal && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 shadow-glow-rose flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                ⚠ ABNORMAL pH DETECTED
              </h3>
              <p className="text-xs text-rose-200 mt-0.5">
                Current: <strong className="text-white font-mono">{currentPH?.toFixed(2)}</strong> | Configured Safe Range: <strong className="text-white">{minSafe} – {maxSafe} pH</strong>
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40">
            CRITICAL DEVIATION
          </span>
        </div>
      )}

      <ErrorBoundary fallbackTitle="Unable to load pH Metric Cards">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-panel p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current pH</span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className={`text-4xl font-extrabold font-mono ${
                !isConnected ? 'text-slate-500' : (isAbnormal ? 'text-rose-400' : 'text-cyan-400')
              }`}>
                {isConnected ? currentPH?.toFixed(2) : '--'}
              </span>
              <span className="text-sm text-slate-400">pH</span>
            </div>
            <div className="mt-3 flex items-center text-xs text-slate-400 space-x-1.5">
              {isConnected ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sensor Active
                </span>
              ) : (
                <span className="text-slate-500">Sensor Not Connected</span>
              )}
            </div>
          </div>

          <div className="glass-panel p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Observed Range (1h)</span>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">MINIMUM</span>
                <span className="text-xl font-bold font-mono text-slate-200">
                  {stats.min !== null ? stats.min.toFixed(2) : '--'}
                </span>
              </div>
              <div className="text-slate-600 font-mono">→</div>
              <div>
                <span className="text-[10px] text-slate-500 block">MAXIMUM</span>
                <span className="text-xl font-bold font-mono text-slate-200">
                  {stats.max !== null ? stats.max.toFixed(2) : '--'}
                </span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Samples Analyzed: <strong className="text-slate-200">{stats.count}</strong>
            </div>
          </div>

          <div className="glass-panel p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">1h Running Average</span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-4xl font-extrabold font-mono text-emerald-400">
                {stats.avg !== null ? stats.avg.toFixed(2) : '--'}
              </span>
              <span className="text-sm text-slate-400">pH</span>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Target Neutral: <span className="font-mono text-slate-200">7.00 pH</span>
            </div>
          </div>

          <div className="glass-panel p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calibration Profile</span>
            <div className="mt-2 flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold text-white truncate">{calStatus}</span>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Buffer Profile:</span>
              <span className="text-cyan-400 font-medium">4.01 / 7.00 / 10.01</span>
            </div>
          </div>
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Unable to load pH Equilibrium Waveform">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                pH Continuous Equilibrium Waveform
              </h3>
              <p className="text-xs text-slate-400">
                Target safe bounds: {minSafe} – {maxSafe} pH (dashed green thresholds)
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-mono bg-dark-900 text-cyan-400 border border-slate-800">
              Resolution: 0.01 pH
            </span>
          </div>

          <div className="h-72 w-full">
            {loading && history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                Loading pH telemetry waveform...
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                title="No pH Telemetry Available"
                description="Connect the pH probe to the ESP32 to monitor continuous hydrogen-ion equilibrium."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={[5.0, 9.5]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <ReferenceLine y={minSafe} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Min 6.5', fill: '#10b981', fontSize: 10 }} />
                  <ReferenceLine y={maxSafe} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Max 8.5', fill: '#10b981', fontSize: 10 }} />
                  <ReferenceLine y={7.0} stroke="#38bdf8" strokeDasharray="2 2" label={{ value: 'Neutral 7.0', fill: '#38bdf8', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="ph"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#phGrad)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export const WaterAnalysisView = WaterAnalysisPage;
