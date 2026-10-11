import React, { useState, useEffect } from 'react';
import { useHardware } from '../context/HardwareContext';
import { QualityScoreGauge } from '../charts/QualityScoreGauge';
import { RealtimeTelemetryChart } from '../charts/RealtimeTelemetryChart';
import { HardwareStatusBanner } from '../components/common/HardwareStatusBanner';
import { SensorCard } from '../components/common/SensorCard';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  Droplets,
  Thermometer,
  Gauge,
  Eye,
  Zap,
  Waves,
  Activity,
  AlertTriangle,
  FlaskConical,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import type { AlertItem } from '../types';

export const DashboardPage: React.FC<{ onNavigate: (view: any) => void }> = ({ onNavigate }) => {
  const {
    activeDeviceId,
    latestReading,
    wqi,
    deviceStatus,
    activeAlerts
  } = useHardware();

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [selectedGraphSensor, setSelectedGraphSensor] = useState<'ph' | 'temperature' | 'tds' | 'turbidity'>('ph');
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  // Load initial history once per device change
  useEffect(() => {
    let isMounted = true;
    const loadInitialHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await api.getHistory(activeDeviceId, '30m', 30);
        if (isMounted && res.success && res.data) {
          const formatted = res.data.map((r: any) => {
            const dateObj = r.timestamp ? new Date(r.timestamp.endsWith('Z') || r.timestamp.includes('T') ? r.timestamp : r.timestamp.replace(' ', 'T') + 'Z') : new Date();
            return {
              time: isNaN(dateObj.getTime()) ? '--:--:--' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              ph: r.ph,
              temperature: r.temperature,
              tds: r.tds,
              turbidity: r.turbidity
            };
          });
          setHistoryData(formatted);
        }
      } catch (e) {
        console.warn('Dashboard initial history load failed:', e);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };

    loadInitialHistory();
    return () => {
      isMounted = false;
    };
  }, [activeDeviceId]);

  // Reactive append from real-time WebSocket reading (Zero HTTP requests overhead)
  useEffect(() => {
    if (!latestReading || !latestReading.timestamp) return;

    const timeStr = new Date(latestReading.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    setHistoryData((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
        return prev;
      }
      const newPoint = {
        time: timeStr,
        ph: latestReading.ph,
        temperature: latestReading.temperature,
        tds: latestReading.tds,
        turbidity: latestReading.turbidity
      };
      const updated = [...prev, newPoint];
      return updated.slice(-30);
    });
  }, [latestReading]);

  return (
    <div className="space-y-6">
      <ErrorBoundary fallbackTitle="Unable to load Hardware Status">
        <HardwareStatusBanner />
      </ErrorBoundary>

      {/* Featured Feature Callout: TDS Drinking Water Suitability Checker */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-dark-850 to-indigo-950/40 p-4 rounded-2xl border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-500/30 shrink-0">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">IoT TDS Drinking Water Suitability Checker</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ESP8266 NodeMCU &lt; ₹2000
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time indicative drinkability evaluation (≤300 ppm: Drinkable • &gt;500 ppm: Not Recommended) and predicted mineral ions.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('tds-checker')}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-950 text-xs font-bold transition-all shadow-glow-cyan flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <span>Open TDS Checker</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <ErrorBoundary fallbackTitle="Unable to load Water Quality Gauge">
        <QualityScoreGauge wqi={wqi} />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Unable to load Sensor Telemetry Cards">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Sensor Telemetry
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {deviceStatus === 'ONLINE' ? '🟢 Streaming Real-Time Telemetry' : '🔴 Device Offline'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <SensorCard
              name="pH Level"
              value={latestReading?.ph ?? null}
              unit="pH"
              isConnected={latestReading?.ph !== null && latestReading?.ph !== undefined}
              minSafe={6.5}
              maxSafe={8.5}
              icon={<Droplets className="w-4 h-4" />}
              history={historyData.map(d => d.ph).filter(v => v !== null && v !== undefined)}
              precision={2}
            />
            <SensorCard
              name="Temperature"
              value={latestReading?.temperature ?? null}
              unit="°C"
              isConnected={latestReading?.temperature !== null && latestReading?.temperature !== undefined}
              minSafe={15.0}
              maxSafe={30.0}
              icon={<Thermometer className="w-4 h-4" />}
              history={historyData.map(d => d.temperature).filter(v => v !== null && v !== undefined)}
              precision={1}
            />
            <SensorCard
              name="Total Dissolved Solids"
              value={latestReading?.tds ?? null}
              unit="ppm"
              isConnected={latestReading?.tds !== null && latestReading?.tds !== undefined}
              minSafe={0}
              maxSafe={500}
              icon={<Gauge className="w-4 h-4" />}
              history={historyData.map(d => d.tds).filter(v => v !== null && v !== undefined)}
              precision={0}
            />
            <SensorCard
              name="Turbidity"
              value={latestReading?.turbidity ?? null}
              unit="NTU"
              isConnected={latestReading?.turbidity !== null && latestReading?.turbidity !== undefined}
              minSafe={0}
              maxSafe={5.0}
              icon={<Eye className="w-4 h-4" />}
              history={historyData.map(d => d.turbidity).filter(v => v !== null && v !== undefined)}
              precision={2}
            />
            <SensorCard
              name="Electrical Conductivity"
              value={latestReading?.ec ?? null}
              unit="µS/cm"
              isConnected={latestReading?.ec !== null && latestReading?.ec !== undefined}
              minSafe={0}
              maxSafe={800}
              icon={<Zap className="w-4 h-4" />}
              precision={0}
            />
            <SensorCard
              name="Water Level"
              value={latestReading?.waterLevel ?? null}
              unit="%"
              isConnected={latestReading?.waterLevel !== null && latestReading?.waterLevel !== undefined}
              minSafe={20}
              maxSafe={100}
              icon={<Waves className="w-4 h-4" />}
              precision={1}
            />
          </div>
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Unable to load Live Telemetry Charts & Alerts">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-5">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Real-Time Telemetry Stream
                </h3>
                <p className="text-[11px] text-slate-400">Live multi-sensor continuous telemetry trace</p>
              </div>

              <div className="flex items-center space-x-1 bg-dark-900/90 p-1 rounded-xl border border-slate-700/60">
                {(['ph', 'temperature', 'tds', 'turbidity'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedGraphSensor(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                      selectedGraphSensor === s
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full">
              <RealtimeTelemetryChart
                data={historyData}
                selectedSensor={selectedGraphSensor}
                isLoading={loadingHistory}
              />
            </div>
          </div>

          <div className="glass-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Active Alerts ({activeAlerts.length})
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate('alerts')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5">
                {activeAlerts.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                      ✓
                    </div>
                    <span>All parameters operating within safe limits</span>
                  </div>
                ) : (
                  activeAlerts.slice(0, 3).map((a: AlertItem) => (
                    <div
                      key={a.id}
                      className={`p-3 rounded-xl border text-xs ${
                        a.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span>{a.sensor} Sensor</span>
                        <span className="text-[10px] uppercase font-bold">{a.severity}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2">{a.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Need probe calibration?</span>
              <button
                onClick={() => onNavigate('calibration')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-all"
              >
                Calibrate Probes
              </button>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export const DashboardView = DashboardPage;
