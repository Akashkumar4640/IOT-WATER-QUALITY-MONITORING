import React, { useState, useEffect } from 'react';
import { useHardware } from '../context/HardwareContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { History } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';

export const SensorHistoryPage: React.FC = () => {
  const { activeDeviceId } = useHardware();
  const [range, setRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [readings, setReadings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<string>('ph');

  const fetchHistory = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const limit = range === '30d' ? 300 : (range === '7d' ? 200 : 100);
      const res = await api.getHistory(activeDeviceId, range, limit);
      if (res.success) {
        setReadings(res.data || []);
        setStats(res.stats || {});
      } else {
        const errObj = res.error;
        setError(typeof errObj === 'string' ? errObj : errObj?.message || 'Failed to load historical dataset');
      }
    } catch (e: any) {
      setError(e.message || 'Error loading history');
    } finally {
      setLoading(false);
    }
  }, [activeDeviceId, range]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const currentStat = stats[selectedSensor] || { min: null, max: null, avg: null, count: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Historical Sensor Telemetry & Statistical Audit
          </h2>
          <p className="text-xs text-slate-400">
            Audit long-term water quality parameters, statistical dispersion, and historical trends
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-dark-850 p-1.5 rounded-xl border border-slate-700/60">
          {[
            { key: '1h', label: 'Last Hour' },
            { key: '24h', label: 'Today (24h)' },
            { key: '7d', label: 'Last 7 Days' },
            { key: '30d', label: 'Last 30 Days' }
          ].map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r.key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'ph', name: 'pH Level', unit: 'pH', color: '#22d3ee' },
          { key: 'temperature', name: 'Temperature', unit: '°C', color: '#f59e0b' },
          { key: 'tds', name: 'TDS', unit: 'ppm', color: '#10b981' },
          { key: 'turbidity', name: 'Turbidity', unit: 'NTU', color: '#a855f7' },
          { key: 'ec', name: 'EC', unit: 'µS/cm', color: '#3b82f6' },
          { key: 'waterLevel', name: 'Water Level', unit: '%', color: '#ec4899' }
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSelectedSensor(s.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              selectedSensor === s.key
                ? 'bg-slate-800 text-white border shadow-md'
                : 'bg-dark-900/80 text-slate-400 border border-slate-800 hover:bg-slate-800/60'
            }`}
            style={{ borderColor: selectedSensor === s.key ? s.color : '#334155' }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      <ErrorBoundary fallbackTitle="Unable to load Historical Stats">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Average Reading</span>
            <div className="mt-1 text-2xl font-bold font-mono text-cyan-400">
              {currentStat.avg !== null && currentStat.avg !== undefined ? currentStat.avg : '--'}
            </div>
            <span className="text-[10px] text-slate-500">Period Statistical Mean</span>
          </div>

          <div className="glass-panel p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Minimum Recorded</span>
            <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
              {currentStat.min !== null && currentStat.min !== undefined ? currentStat.min : '--'}
            </div>
            <span className="text-[10px] text-slate-500">Lowest Dip</span>
          </div>

          <div className="glass-panel p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Maximum Peak</span>
            <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
              {currentStat.max !== null && currentStat.max !== undefined ? currentStat.max : '--'}
            </div>
            <span className="text-[10px] text-slate-500">Highest Surge</span>
          </div>

          <div className="glass-panel p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Samples</span>
            <div className="mt-1 text-2xl font-bold font-mono text-slate-100">
              {currentStat.count ?? 0}
            </div>
            <span className="text-[10px] text-slate-500">Stored Telemetry Packets</span>
          </div>
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Unable to load Historical Graph">
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Historical Parameter Graph ({selectedSensor.toUpperCase()})
          </h3>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                Loading historical dataset...
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-rose-400 space-y-2">
                <span>{error}</span>
                <button
                  onClick={fetchHistory}
                  className="px-3 py-1 bg-dark-850 text-cyan-300 border border-slate-700 rounded-lg"
                >
                  Retry Query
                </button>
              </div>
            ) : readings.length === 0 ? (
              <EmptyState
                title="No Telemetry Data Recorded"
                description="No sensor readings have been stored for this time window. Readings will populate as telemetry is received."
                actionText="Refresh Query"
                onAction={fetchHistory}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                    labelFormatter={(l) => typeof l === 'string' ? new Date(l).toLocaleString() : ''}
                  />
                  <Line
                    type="monotone"
                    dataKey={selectedSensor}
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Unable to load Historical Raw Logs">
        <div className="glass-panel p-6 overflow-x-auto">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Raw Historical Telemetry Logs
          </h3>

          {readings.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No historical log rows available for this period.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">pH</th>
                  <th className="py-2.5 px-3">Temperature (°C)</th>
                  <th className="py-2.5 px-3">TDS (ppm)</th>
                  <th className="py-2.5 px-3">Turbidity (NTU)</th>
                  <th className="py-2.5 px-3">EC (µS/cm)</th>
                  <th className="py-2.5 px-3">Level (%)</th>
                  <th className="py-2.5 px-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {readings.slice(-10).reverse().map((r) => (
                  <tr key={r.id || `${r.timestamp}-${Math.random()}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">{new Date(r.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">{r.ph !== null && r.ph !== undefined ? r.ph : '--'}</td>
                    <td className="py-2.5 px-3 text-amber-300">{r.temperature !== null && r.temperature !== undefined ? r.temperature : '--'}</td>
                    <td className="py-2.5 px-3 text-emerald-300">{r.tds !== null && r.tds !== undefined ? r.tds : '--'}</td>
                    <td className="py-2.5 px-3 text-purple-300">{r.turbidity !== null && r.turbidity !== undefined ? r.turbidity : '--'}</td>
                    <td className="py-2.5 px-3 text-blue-300">{r.ec !== null && r.ec !== undefined ? r.ec : '--'}</td>
                    <td className="py-2.5 px-3 text-pink-300">{r.waterLevel !== null && r.waterLevel !== undefined ? r.waterLevel : '--'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                        r.isSimulated ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {r.isSimulated ? 'Simulated' : 'ESP32 Live'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
};

export const SensorHistoryView = SensorHistoryPage;
