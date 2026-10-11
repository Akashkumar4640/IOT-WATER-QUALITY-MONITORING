import React, { useState, useEffect } from 'react';
import { useHardware } from '../context/HardwareContext';
import { SensorCard } from '../components/common/SensorCard';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import {
  Droplets,
  Thermometer,
  Gauge,
  Eye,
  Zap,
  Waves,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';

export const LiveMonitoringPage: React.FC = () => {
  const { activeDeviceId, latestReading } = useHardware();
  const [timeWindow, setTimeWindow] = useState<'5m' | '30m' | '1h' | '24h'>('30m');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSensors, setActiveSensors] = useState<Record<string, boolean>>({
    ph: true,
    temperature: true,
    tds: true,
    turbidity: true,
    ec: false,
    waterLevel: false
  });

  // Fetch historical data on device or timeWindow change
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getHistory(activeDeviceId, timeWindow, 60);
        if (isMounted) {
          if (res.success && res.data) {
            const formatted = res.data.map((r: any) => {
              const dateObj = r.timestamp ? new Date(r.timestamp.endsWith('Z') || r.timestamp.includes('T') ? r.timestamp : r.timestamp.replace(' ', 'T') + 'Z') : new Date();
              return {
                timestamp: r.timestamp,
                time: isNaN(dateObj.getTime()) ? '--:--:--' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                ph: r.ph,
                temperature: r.temperature,
                tds: r.tds,
                turbidity: r.turbidity,
                ec: r.ec,
                waterLevel: r.waterLevel
              };
            });
            setHistory(formatted);
          } else {
            const errObj = res.error;
            setError(typeof errObj === 'string' ? errObj : errObj?.message || 'Failed to load telemetry');
          }
        }
      } catch (e: any) {
        if (isMounted) setError(e.message || 'Network error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [activeDeviceId, timeWindow]);

  // Reactive append from latest reading (Zero HTTP call overhead)
  useEffect(() => {
    if (!latestReading || !latestReading.timestamp) return;

    const timeStr = new Date(latestReading.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    setHistory((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
        return prev;
      }
      const newPoint = {
        timestamp: latestReading.timestamp,
        time: timeStr,
        ph: latestReading.ph,
        temperature: latestReading.temperature,
        tds: latestReading.tds,
        turbidity: latestReading.turbidity,
        ec: latestReading.ec,
        waterLevel: latestReading.waterLevel
      };
      const updated = [...prev, newPoint];
      return updated.slice(-60);
    });
  }, [latestReading]);

  const toggleSensor = (key: string) => {
    setActiveSensors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Live Environmental Sensor Monitoring
          </h2>
          <p className="text-xs text-slate-400">
            Real-time continuous telemetry stream from ESP32 hardware device
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-dark-850 p-1.5 rounded-xl border border-slate-700/60">
          {(['5m', '30m', '1h', '24h'] as const).map(w => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeWindow === w
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {w === '5m' ? 'Last 5m' : (w === '30m' ? 'Last 30m' : (w === '1h' ? 'Last 1h' : 'Last 24h'))}
            </button>
          ))}
        </div>
      </div>

      <ErrorBoundary fallbackTitle="Unable to load Live Sensor Cards">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SensorCard
            name="pH"
            value={latestReading?.ph ?? null}
            unit="pH"
            isConnected={latestReading?.ph !== null && latestReading?.ph !== undefined}
            minSafe={6.5}
            maxSafe={8.5}
            icon={<Droplets className="w-5 h-5" />}
            history={history.map(d => d.ph).filter(v => v !== null && v !== undefined)}
            precision={2}
          />
          <SensorCard
            name="Temperature"
            value={latestReading?.temperature ?? null}
            unit="°C"
            isConnected={latestReading?.temperature !== null && latestReading?.temperature !== undefined}
            minSafe={15.0}
            maxSafe={30.0}
            icon={<Thermometer className="w-5 h-5" />}
            history={history.map(d => d.temperature).filter(v => v !== null && v !== undefined)}
            precision={1}
          />
          <SensorCard
            name="Turbidity"
            value={latestReading?.turbidity ?? null}
            unit="NTU"
            isConnected={latestReading?.turbidity !== null && latestReading?.turbidity !== undefined}
            minSafe={0}
            maxSafe={5.0}
            icon={<Eye className="w-5 h-5" />}
            history={history.map(d => d.turbidity).filter(v => v !== null && v !== undefined)}
            precision={2}
          />
          <SensorCard
            name="TDS"
            value={latestReading?.tds ?? null}
            unit="ppm"
            isConnected={latestReading?.tds !== null && latestReading?.tds !== undefined}
            minSafe={0}
            maxSafe={500}
            icon={<Gauge className="w-5 h-5" />}
            history={history.map(d => d.tds).filter(v => v !== null && v !== undefined)}
            precision={0}
          />
          <SensorCard
            name="Electrical Conductivity"
            value={latestReading?.ec ?? null}
            unit="µS/cm"
            isConnected={latestReading?.ec !== null && latestReading?.ec !== undefined}
            minSafe={0}
            maxSafe={800}
            icon={<Zap className="w-5 h-5" />}
            history={history.map(d => d.ec).filter(v => v !== null && v !== undefined)}
            precision={0}
          />
          <SensorCard
            name="Water Level"
            value={latestReading?.waterLevel ?? null}
            unit="%"
            isConnected={latestReading?.waterLevel !== null && latestReading?.waterLevel !== undefined}
            minSafe={20}
            maxSafe={100}
            icon={<Waves className="w-5 h-5" />}
            history={history.map(d => d.waterLevel).filter(v => v !== null && v !== undefined)}
            precision={1}
          />
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Unable to load Interactive Waveform Chart">
        <div className="glass-panel p-6">
          <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Interactive Multi-Sensor Waveform
              </h3>
              <p className="text-xs text-slate-400">Toggle sensor channels to inspect multi-parameter correlations</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'ph', label: 'pH', color: '#22d3ee' },
                { key: 'temperature', label: 'Temp (°C)', color: '#f59e0b' },
                { key: 'tds', label: 'TDS (ppm)', color: '#10b981' },
                { key: 'turbidity', label: 'Turbidity (NTU)', color: '#a855f7' },
                { key: 'ec', label: 'EC (µS/cm)', color: '#3b82f6' },
                { key: 'waterLevel', label: 'Level (%)', color: '#ec4899' }
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => toggleSensor(s.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                    activeSensors[s.key]
                      ? 'bg-slate-800 text-white border shadow-md'
                      : 'bg-dark-900 text-slate-500 border border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                  style={{ borderColor: activeSensors[s.key] ? s.color : '#334155' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-80 w-full">
            {loading && history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                Loading telemetry waveform...
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-rose-400">
                <span>{error}</span>
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                title="No Sensor Data Available"
                description="Connect the ESP32 hardware device to start receiving real-time water quality measurements."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                  {activeSensors.ph && (
                    <Line type="monotone" dataKey="ph" name="pH" stroke="#22d3ee" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  )}
                  {activeSensors.temperature && (
                    <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  )}
                  {activeSensors.tds && (
                    <Line type="monotone" dataKey="tds" name="TDS (ppm)" stroke="#10b981" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  )}
                  {activeSensors.turbidity && (
                    <Line type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="#a855f7" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  )}
                  {activeSensors.ec && (
                    <Line type="monotone" dataKey="ec" name="EC (µS/cm)" stroke="#3b82f6" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  )}
                  {activeSensors.waterLevel && (
                    <Line type="monotone" dataKey="waterLevel" name="Level (%)" stroke="#ec4899" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export const LiveMonitoringView = LiveMonitoringPage;
