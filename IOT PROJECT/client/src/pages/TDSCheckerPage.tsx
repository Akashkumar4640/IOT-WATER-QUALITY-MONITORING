import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Droplets,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Activity,
  PlusCircle,
  RotateCcw,
  Zap,
  Cpu,
  FileCode,
  Info,
  CheckCircle2,
  Copy,
  Check,
  FlaskConical,
  Flame,
  ArrowUpRight
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
import { getSocket } from '../services/socket';
import type { TDSReading, TDSHistoryStats } from '../types';

export const TDSCheckerPage: React.FC = () => {
  const [reading, setReading] = useState<TDSReading | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<TDSHistoryStats | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'hardware' | 'code' | 'about'>('monitor');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [pulseLive, setPulseLive] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);

  // Fetch latest reading and history
  const fetchTDSData = useCallback(async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        api.getLatestTDS(),
        api.getTDSHistory(undefined, 30)
      ]);

      if (!isMountedRef.current) return;

      if (latestRes.success && latestRes.data) {
        setReading(latestRes.data);
        setLastUpdated(new Date());
      }
      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data.data || []);
        setStats(historyRes.data.stats || null);
      }
    } catch (err) {
      console.error('Error fetching TDS data:', err);
    }
  }, []);

  // Real-time socket subscription
  useEffect(() => {
    isMountedRef.current = true;
    fetchTDSData();

    const socket = getSocket();

    const handleTDSReading = (newReading: TDSReading) => {
      if (!isMountedRef.current) return;
      setReading(newReading);
      setLastUpdated(new Date());
      setPulseLive(true);
      setTimeout(() => {
        if (isMountedRef.current) setPulseLive(false);
      }, 1000);

      // Append to history
      setHistory(prev => {
        const updated = [...prev, {
          id: newReading.id,
          deviceId: newReading.deviceId,
          timestamp: newReading.timestamp,
          tds: newReading.tds,
          voltage: newReading.voltage,
          statusCode: newReading.statusCode,
          statusLabel: newReading.statusLabel,
          color: newReading.color,
          likelyComponents: newReading.likelyComponents
        }];
        return updated.slice(-30);
      });
    };

    socket.on('tds_reading', handleTDSReading);

    return () => {
      isMountedRef.current = false;
      socket.off('tds_reading', handleTDSReading);
    };
  }, [fetchTDSData]);

  // Handle Salt Addition Demo
  const handleSaltAction = async (action: string, amount?: number, preset?: string) => {
    setIsSimulating(true);
    try {
      const res = await api.simulateSalt({ action, amount, preset });
      if (res.success && res.data) {
        setReading(res.data);
        setLastUpdated(new Date());
        setPulseLive(true);
        setTimeout(() => setPulseLive(false), 1200);
      }
    } catch (e) {
      console.error('Salt simulation error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(NODEMCU_FIRMWARE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const currentTds = reading ? reading.tds : 185;
  const currentStatus = reading ? reading.statusCode : 'DRINKABLE';

  // Zone status helpers
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'DRINKABLE':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          indicator: 'bg-emerald-400',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
        };
      case 'CAUTION':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          indicator: 'bg-amber-400',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
        };
      case 'UNSAFE':
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          indicator: 'bg-rose-400',
          icon: <XCircle className="w-5 h-5 text-rose-400" />
        };
    }
  };

  const badgeStyle = getBadgeStyle(currentStatus);

  // Gauge calculation (0 to 1000 ppm scale)
  const gaugePercent = Math.min(100, Math.max(0, (currentTds / 1000) * 100));

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-dark-900 shadow-glow-cyan">
              <FlaskConical className="w-7 h-7 text-dark-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ESP8266 NodeMCU • Low-Cost IoT
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Hardware &lt; ₹2000
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-full ${
                  pulseLive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-dark-900/60 text-slate-400'
                } transition-all duration-300`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Telemetry
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
                Drinking Water Suitability Checker
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Real-time Total Dissolved Solids (TDS) monitoring, drinkability verdict, and predicted dissolved mineral ions.
              </p>
            </div>
          </div>

          {/* Quick Tab Selector */}
          <div className="flex items-center bg-dark-900/90 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'monitor'
                  ? 'bg-cyan-500 text-dark-950 font-bold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Monitor
            </button>
            <button
              onClick={() => setActiveTab('hardware')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'hardware'
                  ? 'bg-cyan-500 text-dark-950 font-bold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hardware & Wiring
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-cyan-500 text-dark-950 font-bold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              NodeMCU Firmware
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'about'
                  ? 'bg-cyan-500 text-dark-950 font-bold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scope & Logic
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'monitor' && (
        <>
          {/* Main Hero Verdict Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Primary Gauge & Verdict Card (7 Cols) */}
            <div className="lg:col-span-7 bg-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                      Real-Time Sensor Telemetry
                    </h2>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Device: <span className="text-cyan-400">{reading?.deviceId || 'NODEMCU-TDS-01'}</span>
                  </div>
                </div>

                {/* Big TDS Metric Display */}
                <div className="flex flex-col md:flex-row items-start md:items-baseline gap-4 my-3">
                  <div className="flex items-baseline">
                    <span className="text-6xl md:text-7xl font-black tracking-tight text-white font-mono">
                      {currentTds}
                    </span>
                    <span className="ml-2 text-xl font-bold text-slate-400">ppm</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {(currentTds * 1.45).toFixed(0)} µS/cm (EC)
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {reading?.voltage ? `${reading.voltage}V` : '1.15V'} (A0)
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {reading?.temperature ? `${reading.temperature}°C` : '25.0°C'}
                    </span>
                  </div>
                </div>

                {/* Visual TDS Scale Progress Bar */}
                <div className="mt-4 mb-6">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                    <span className="text-emerald-400">0 - 300 ppm (Drinkable)</span>
                    <span className="text-amber-400">300 - 500 ppm (Caution)</span>
                    <span className="text-rose-400">&gt; 500 ppm (Not Recommended)</span>
                  </div>

                  <div className="h-4 bg-dark-900 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
                    {/* Background Zones */}
                    <div className="absolute inset-0 flex h-full rounded-full overflow-hidden pointer-events-none opacity-40">
                      <div className="w-[30%] bg-emerald-500"></div>
                      <div className="w-[20%] bg-amber-500"></div>
                      <div className="w-[50%] bg-rose-500"></div>
                    </div>

                    {/* Active Needle Indicator */}
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        currentStatus === 'DRINKABLE'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : currentStatus === 'CAUTION'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                          : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                      }`}
                      style={{ width: `${gaugePercent}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>0 ppm</span>
                    <span className="text-slate-400 font-semibold">300 ppm</span>
                    <span className="text-slate-400 font-semibold">500 ppm</span>
                    <span>1000+ ppm</span>
                  </div>
                </div>

                {/* Project-Mandated Official Indicative Status Box */}
                <div className={`p-4 rounded-xl border ${badgeStyle.bg} transition-all duration-300`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-dark-900/60 border border-current">
                      {badgeStyle.icon}
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider font-bold opacity-75">
                        Water Suitability Decision
                      </div>
                      <div className="text-lg md:text-xl font-extrabold tracking-tight">
                        {reading?.statusLabel || (
                          currentTds <= 300
                            ? 'Drinkable (indicative)'
                            : currentTds <= 500
                            ? 'High TDS – use with caution (indicative)'
                            : 'Not recommended for drinking (indicative)'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700/40 text-xs md:text-sm text-slate-200">
                    <span className="font-semibold text-white">Likely Components: </span>
                    <span className="font-mono text-slate-300">
                      {reading?.likelyComponents || (
                        currentTds <= 300
                          ? 'Moderate minerals – likely calcium, magnesium, bicarbonates.'
                          : currentTds <= 500
                          ? 'High minerals/salts – likely calcium, magnesium; possibly sodium, chloride, sulfate.'
                          : 'Very high salts/minerals – likely high sodium, chloride, sulfate, nitrates, along with calcium and magnesium.'
                      )}
                    </span>
                  </div>

                  {reading?.advisory && (
                    <div className="mt-2 text-xs text-slate-400 italic">
                      ℹ️ {reading.advisory}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Last NodeMCU Transmission: {lastUpdated.toLocaleTimeString()}</span>
                <span>Indicative assessment • Not lab-grade</span>
              </div>
            </div>

            {/* Live Interactive Salt Demonstration Studio (5 Cols) */}
            <div className="lg:col-span-5 bg-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                      Live Salt Addition Demonstration
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Interactive
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4">
                  Simulate the project demonstration: adding common table salt (NaCl) increases electrical conductivity, raising TDS and altering the drinkability verdict in real time.
                </p>

                {/* Salt Action Buttons */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleSaltAction('add_salt', 100)}
                      disabled={isSimulating}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      <span>+ Pinch Salt (+100 ppm)</span>
                    </button>

                    <button
                      onClick={() => handleSaltAction('add_salt', 250)}
                      disabled={isSimulating}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <PlusCircle className="w-4 h-4 text-amber-400" />
                      <span>+ Spoon Salt (+250 ppm)</span>
                    </button>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-2">
                    Quick Sample Presets:
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleSaltAction('preset', undefined, 'clean')}
                      disabled={isSimulating}
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 transition-all text-center"
                    >
                      Clean Water
                      <span className="block font-mono text-[10px] text-emerald-300 font-normal">~160 ppm</span>
                    </button>

                    <button
                      onClick={() => handleSaltAction('preset', undefined, 'caution')}
                      disabled={isSimulating}
                      className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-bold text-amber-400 transition-all text-center"
                    >
                      Mineral / Caution
                      <span className="block font-mono text-[10px] text-amber-300 font-normal">~395 ppm</span>
                    </button>

                    <button
                      onClick={() => handleSaltAction('preset', undefined, 'saline')}
                      disabled={isSimulating}
                      className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-bold text-rose-400 transition-all text-center"
                    >
                      Saline / Unsafe
                      <span className="block font-mono text-[10px] text-rose-300 font-normal">~680 ppm</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleSaltAction('reset')}
                    disabled={isSimulating}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-semibold text-cyan-300 transition-all mt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Filtered Drinking Water (155 ppm)</span>
                  </button>
                </div>
              </div>

              {/* Status Explanation helper */}
              <div className="mt-4 p-3 bg-dark-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  Physics Note:
                </div>
                <p>
                  Common salt (NaCl) dissociates into $Na^+$ and $Cl^-$ ions, dramatically increasing ionic conductivity. The analog TDS sensor probe measures this conductivity, converting it into a higher voltage reading on NodeMCU pin A0.
                </p>
              </div>
            </div>
          </div>

          {/* Likely Dissolved Components Chemical Ion Breakdown */}
          <div className="bg-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">
                  Predicted Dissolved Mineral & Salt Breakdown
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">
                Calculated roughly from current TDS range ({currentTds} ppm)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(reading?.breakdown || []).map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-dark-900/80 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                      {item.formula}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      ~{item.estPpm} ppm
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-200">
                    {item.name}
                  </h3>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {item.role}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Trend Chart & Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart (8 cols) */}
            <div className="lg:col-span-8 bg-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Historical TDS Trend (ppm)
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> &le;300 Safe
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> 500 Max
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="tdsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#64748b"
                      fontSize={10}
                      tickFormatter={(val) => {
                        try {
                          return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        } catch {
                          return '';
                        }
                      }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      domain={[0, (dataMax: number) => Math.max(600, dataMax + 100)]}
                      unit=" ppm"
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                      formatter={(value: any) => [`${value} ppm`, 'TDS']}
                      labelFormatter={(label: any) => (label ? new Date(String(label)).toLocaleTimeString() : '')}
                    />
                    {/* Indicative Threshold Reference Lines */}
                    <ReferenceLine y={300} stroke="#10b981" strokeDasharray="3 3" label={{ value: '300 ppm (Drinkable Threshold)', fill: '#10b981', fontSize: 10, position: 'top' }} />
                    <ReferenceLine y={500} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '500 ppm (Upper Safe Limit)', fill: '#f43f5e', fontSize: 10, position: 'top' }} />
                    <Area
                      type="monotone"
                      dataKey="tds"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#tdsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Statistics & Distribution (4 cols) */}
            <div className="lg:col-span-4 bg-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">
                  TDS Statistics & Compliance
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-dark-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono block">AVERAGE TDS</span>
                    <span className="text-xl font-bold font-mono text-white">
                      {stats ? `${stats.avg} ppm` : `${currentTds} ppm`}
                    </span>
                  </div>
                  <div className="p-3 bg-dark-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono block">RECORDED RANGE</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">
                      {stats ? `${stats.min} - ${stats.max}` : `${currentTds}`} <span className="text-xs">ppm</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-400 font-medium">Drinkable (&le; 300 ppm)</span>
                      <span className="font-mono text-slate-300">
                        {stats ? stats.drinkableCount : 1} samples
                      </span>
                    </div>
                    <div className="w-full bg-dark-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: stats && stats.totalReadings > 0
                            ? `${(stats.drinkableCount / stats.totalReadings) * 100}%`
                            : '100%'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-amber-400 font-medium">High Minerals (300-500 ppm)</span>
                      <span className="font-mono text-slate-300">
                        {stats ? stats.cautionCount : 0} samples
                      </span>
                    </div>
                    <div className="w-full bg-dark-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{
                          width: stats && stats.totalReadings > 0
                            ? `${(stats.cautionCount / stats.totalReadings) * 100}%`
                            : '0%'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-rose-400 font-medium">Unsuitable (&gt; 500 ppm)</span>
                      <span className="font-mono text-slate-300">
                        {stats ? stats.unsafeCount : 0} samples
                      </span>
                    </div>
                    <div className="w-full bg-dark-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{
                          width: stats && stats.totalReadings > 0
                            ? `${(stats.unsafeCount / stats.totalReadings) * 100}%`
                            : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                API Endpoint: <span className="text-slate-400">POST /api/tds/telemetry</span>
              </div>
            </div>
          </div>

          {/* Historical Log Table */}
          <div className="bg-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Recent Telemetry Stream & Verdict Log
              </h2>
              <span className="text-xs text-slate-500 font-mono">Showing last 10 entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-3 px-3">Timestamp</th>
                    <th className="pb-3 px-3">Device</th>
                    <th className="pb-3 px-3">TDS (ppm)</th>
                    <th className="pb-3 px-3">Voltage (A0)</th>
                    <th className="pb-3 px-3">Drinkability Verdict</th>
                    <th className="pb-3 px-3">Predicted Components</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {history.slice(-10).reverse().map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(row.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 text-cyan-400">{row.deviceId}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{row.tds} ppm</td>
                      <td className="py-2.5 px-3 text-slate-400">{row.voltage ? `${row.voltage}V` : '--'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          row.statusCode === 'DRINKABLE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : row.statusCode === 'CAUTION'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {row.statusLabel || row.statusCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                        {row.likelyComponents}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Hardware Setup & Wiring */}
      {activeTab === 'hardware' && (
        <div className="space-y-6">
          <div className="bg-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card">
            <div className="flex items-center space-x-3 mb-4">
              <Cpu className="w-6 h-6 text-cyan-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Hardware Architecture & Wiring Diagram</h2>
                <p className="text-xs text-slate-400">Total bill of materials kept under ₹2000 using ESP8266 NodeMCU and Analog TDS sensor module</p>
              </div>
            </div>

            {/* Bill of Materials Table */}
            <div className="overflow-x-auto my-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-3 px-3">Component</th>
                    <th className="pb-3 px-3">Specification</th>
                    <th className="pb-3 px-3">Purpose</th>
                    <th className="pb-3 px-3">Estimated Cost (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">ESP8266 NodeMCU V3</td>
                    <td className="py-2.5 px-3 text-slate-300">Wi-Fi SoC (802.11 b/g/n, 80MHz, 1x ADC A0)</td>
                    <td className="py-2.5 px-3 text-slate-400">Reads analog TDS voltage and sends HTTP POST via Wi-Fi</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">₹350 - ₹450</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Analog TDS Sensor Module + Probe</td>
                    <td className="py-2.5 px-3 text-slate-300">0 - 1000 ppm, 3.3V - 5.5V input, waterproof probe</td>
                    <td className="py-2.5 px-3 text-slate-400">Measures electrical conductivity of water sample</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">₹650 - ₹850</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">Breadboard & Jumper Wires</td>
                    <td className="py-2.5 px-3 text-slate-300">Half-size breadboard + Male-to-Female jumpers</td>
                    <td className="py-2.5 px-3 text-slate-400">No-soldering rapid hardware prototyping</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">₹100 - ₹150</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">5V Micro-USB Power Supply</td>
                    <td className="py-2.5 px-3 text-slate-300">Standard 5V 1A mobile phone charger</td>
                    <td className="py-2.5 px-3 text-slate-400">Powers NodeMCU and sensor continuously</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">₹150 (or reused free)</td>
                  </tr>
                  <tr className="bg-cyan-500/10 font-bold text-cyan-300">
                    <td className="py-3 px-3">TOTAL PROJECT HARDWARE COST</td>
                    <td className="py-3 px-3" colSpan={2}>Extremely low-cost drinking water quality monitor</td>
                    <td className="py-3 px-3 text-emerald-300 text-sm">~ ₹1,250 - ₹1,550 (&lt; ₹2000 Target)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pin Connection Table */}
            <h3 className="text-sm font-bold text-white mt-6 mb-3">NodeMCU ESP8266 Pin Connections</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-dark-900 border border-slate-800">
                <span className="text-[10px] text-cyan-400 font-mono block">SIGNAL PIN</span>
                <h4 className="text-base font-bold text-white">TDS Sensor AOUT &rarr; NodeMCU A0</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Connects the analog voltage output (0–3.3V) directly into the NodeMCU built-in 10-bit ADC channel (pin A0).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-dark-900 border border-slate-800">
                <span className="text-[10px] text-rose-400 font-mono block">POWER PIN</span>
                <h4 className="text-base font-bold text-white">TDS Sensor VCC &rarr; NodeMCU 3V3 / VIN</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Connect to 3.3V pin on NodeMCU (or 5V VIN if sensor module supports 5V with voltage divider).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-dark-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono block">GROUND PIN</span>
                <h4 className="text-base font-bold text-white">TDS Sensor GND &rarr; NodeMCU GND</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Common reference ground for low-noise analog voltage conversion.
                </p>
              </div>
            </div>

            {/* Mathematical Conversion Formula */}
            <div className="mt-6 p-4 rounded-xl bg-dark-900 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                TDS Calibration Formula (Polynomial Voltage to PPM Conversion)
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                The ESP8266 ADC samples the probe analog voltage (0 to 1023). The voltage is compensated for temperature (standardized to 25°C) and transformed via the standard 3rd-order TDS polynomial:
              </p>
              <div className="bg-dark-950 p-3 rounded-lg font-mono text-xs text-cyan-300 border border-slate-800 overflow-x-auto space-y-1">
                <div>float averageVoltage = (analogRead(A0) * 3.3) / 1024.0;</div>
                <div>float compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0);</div>
                <div>float compensationVoltage = averageVoltage / compensationCoefficient;</div>
                <div>float tdsValue = (133.42 * pow(compensationVoltage, 3) - 255.86 * pow(compensationVoltage, 2) + 857.39 * compensationVoltage) * 0.5;</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: NodeMCU Firmware Code */}
      {activeTab === 'code' && (
        <div className="bg-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileCode className="w-6 h-6 text-cyan-400" />
              <div>
                <h2 className="text-lg font-bold text-white">ESP8266 NodeMCU Arduino Sketch</h2>
                <p className="text-xs text-slate-400">Complete, ready-to-flash Arduino C++ firmware sending HTTP POST telemetry to your website</p>
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-dark-950 font-bold text-xs shadow-glow-cyan hover:bg-cyan-400 transition-all active:scale-95"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Sketch'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="bg-dark-950 p-5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
              <code>{NODEMCU_FIRMWARE_CODE}</code>
            </pre>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-400 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Flashing Instructions (Arduino IDE)
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Open Arduino IDE &rarr; Boards Manager &rarr; Install <strong>ESP8266 by ESP8266 Community</strong>.</li>
              <li>Select Board: <strong>NodeMCU 1.0 (ESP-12E Module)</strong>.</li>
              <li>Change <code className="text-cyan-400">WIFI_SSID</code> and <code className="text-cyan-400">WIFI_PASSWORD</code> to your Wi-Fi credentials.</li>
              <li>Set <code className="text-cyan-400">SERVER_URL</code> to your server IP address (e.g. <code className="text-cyan-400">http://192.168.1.100:5000/api/tds/telemetry</code>).</li>
              <li>Connect NodeMCU via micro-USB and click <strong>Upload</strong>.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab: Project Scope, Logic & Limitations */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          {/* Decision Logic Grid */}
          <div className="bg-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card">
            <h2 className="text-lg font-bold text-white mb-2">TDS-Based Decision Logic (Indicative)</h2>
            <p className="text-xs text-slate-400 mb-4">
              Predefined drinking water safety thresholds implemented in the website logic:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Range 1 */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                    TDS &le; 300 ppm
                  </span>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white">Drinkable (indicative)</h3>
                <p className="text-xs text-slate-300 mt-2 font-mono">
                  “Moderate minerals – likely calcium, magnesium, bicarbonates.”
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Optimal drinking range. Balanced taste and natural mineral nutrients recommended for daily hydration.
                </p>
              </div>

              {/* Range 2 */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                    300 &lt; TDS &le; 500 ppm
                  </span>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white">High TDS – use with caution (indicative)</h3>
                <p className="text-xs text-slate-300 mt-2 font-mono">
                  “High minerals/salts – likely calcium, magnesium; possibly sodium, chloride, sulfate.”
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Acceptable upper limit. Suitable for general use, but contains higher dissolved salts that may taste mineralized.
                </p>
              </div>

              {/* Range 3 */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                    TDS &gt; 500 ppm
                  </span>
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-base font-bold text-white">Not recommended for drinking (indicative)</h3>
                <p className="text-xs text-slate-300 mt-2 font-mono">
                  “Very high salts/minerals – likely high sodium, chloride, sulfate, nitrates, along with calcium and magnesium.”
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Exceeds recommended drinking water threshold. High salinity or mineral hardness. RO filtration recommended.
                </p>
              </div>
            </div>
          </div>

          {/* Limitations and Future Enhancements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card">
              <div className="flex items-center space-x-2 text-amber-400 mb-3">
                <Info className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">System Limitations</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                <li><strong>Conductivity Only:</strong> The sensor measures gross electrical conductivity, which is calibrated to total dissolved solids. It does not detect individual elements directly.</li>
                <li><strong>Microbial Safety:</strong> TDS measurement cannot detect pathogens, bacteria, E. coli, viruses, or microscopic cysts.</li>
                <li><strong>Chemical Contaminants:</strong> Heavy metals (lead, arsenic) and pesticides may be present even in low-TDS water.</li>
                <li><strong>Indicative Verdict:</strong> Decisions are indicative household aids and must not replace accredited laboratory water testing (e.g. BIS 10500 / EPA standards).</li>
              </ul>
            </div>

            <div className="bg-dark-850 p-6 rounded-2xl border border-slate-800/80 shadow-card">
              <div className="flex items-center space-x-2 text-cyan-400 mb-3">
                <ArrowUpRight className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Future Enhancements</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                <li><strong>DS18B20 Temperature Sensor:</strong> Automatic temperature compensation to correct electrical conductivity across hot or cold water samples.</li>
                <li><strong>Turbidity Sensor:</strong> Optical infrared sensor to detect suspended solids, silt, and cloudiness.</li>
                <li><strong>SMS / WhatsApp Alerts:</strong> Twilio or Pushbullet integration when TDS breaches safe drinking limits.</li>
                <li><strong>Multi-Point Calibration:</strong> In-system calibration with 342 ppm NaCl standard solution for enhanced accuracy.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NODEMCU_FIRMWARE_CODE = `/*
 * =========================================================================
 *  IoT Drinking Water Suitability Checker
 *  ESP8266 NodeMCU + Analog TDS Sensor Module
 *  Transmits live TDS telemetry to Web Platform via Wi-Fi HTTP POST
 * =========================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// ---------------- WiFi Credentials ----------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ---------------- Backend Server API Endpoint ----------------
// Replace with your computer's local IP address or web domain:
const char* SERVER_URL    = "http://192.168.1.100:5000/api/tds/telemetry";
const char* DEVICE_ID     = "NODEMCU-TDS-01";

// ---------------- Hardware Pins ----------------
const int TDS_PIN = A0; // NodeMCU Analog ADC pin

// ---------------- Sampling Variables ----------------
#define SCOUNT  30           // Sum of sample points
int analogBuffer[SCOUNT];    // Store analog reading array
int analogBufferTemp[SCOUNT];
int analogBufferIndex = 0;
int copyIndex = 0;

float averageVoltage = 0;
float tdsValue = 0;
float temperature = 25.0; // Standard water temperature (°C)

// Median filtering algorithm for noise reduction
int getMedianNum(int bArray[], int iFilterLen) {
  int bTab[iFilterLen];
  for (byte i = 0; i < iFilterLen; i++)
    bTab[i] = bArray[i];
  int i, j, bTemp;
  for (j = 0; j < iFilterLen - 1; j++) {
    for (i = 0; i < iFilterLen - j - 1; i++) {
      if (bTab[i] > bTab[i + 1]) {
        bTemp = bTab[i];
        bTab[i] = bTab[i + 1];
        bTab[i + 1] = bTemp;
      }
    }
  }
  if ((iFilterLen & 1) > 0)
    bTemp = bTab[(iFilterLen - 1) / 2];
  else
    bTemp = (bTab[iFilterLen / 2] + bTab[iFilterLen / 2 - 1]) / 2;
  return bTemp;
}

void setup() {
  Serial.begin(115200);
  pinMode(TDS_PIN, INPUT);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("  ESP8266 NodeMCU - TDS Water Suitability Checker");
  Serial.println("=================================================");

  // Connect to Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("[Wi-Fi] Connected Successfully!");
  Serial.print("[Wi-Fi] IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  static unsigned long analogSampleTimepoint = millis();
  if (millis() - analogSampleTimepoint > 40U) { // Sample every 40 milliseconds
    analogSampleTimepoint = millis();
    analogBuffer[analogBufferIndex] = analogRead(TDS_PIN);
    analogBufferIndex++;
    if (analogBufferIndex == SCOUNT)
      analogBufferIndex = 0;
  }

  static unsigned long printTimepoint = millis();
  if (millis() - printTimepoint > 3000U) { // Compute and transmit every 3 seconds
    printTimepoint = millis();
    for (copyIndex = 0; copyIndex < SCOUNT; copyIndex++)
      analogBufferTemp[copyIndex] = analogBuffer[copyIndex];

    // Read median analog ADC value
    int medianAdc = getMedianNum(analogBufferTemp, SCOUNT);

    // Convert ADC to voltage (NodeMCU ADC: 0-1023 corresponds to 0-3.3V)
    averageVoltage = (float)medianAdc * (3.3 / 1024.0);

    // Temperature compensation formula: fFinalResult(25^C) = fFinalResult(current)/(1.0+0.02*(fTP-25.0));
    float compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0);
    float compensationVoltage = averageVoltage / compensationCoefficient;

    // Standard 3rd-order polynomial TDS conversion formula
    tdsValue = (133.42 * pow(compensationVoltage, 3) 
               - 255.86 * pow(compensationVoltage, 2) 
               + 857.39 * compensationVoltage) * 0.5;

    if (tdsValue < 0) tdsValue = 0;

    Serial.println("----------------------------------------");
    Serial.print("Raw ADC: "); Serial.println(medianAdc);
    Serial.print("Voltage: "); Serial.print(averageVoltage, 2); Serial.println(" V");
    Serial.print("TDS:     "); Serial.print(tdsValue, 1); Serial.println(" ppm");

    // Decision output in Serial monitor
    if (tdsValue <= 300) {
      Serial.println("Decision: Drinkable (indicative)");
    } else if (tdsValue <= 500) {
      Serial.println("Decision: High TDS – use with caution (indicative)");
    } else {
      Serial.println("Decision: Not recommended for drinking (indicative)");
    }

    // Transmit to Web Platform via HTTP POST
    sendTelemetryToServer(tdsValue, averageVoltage, medianAdc);
  }
}

void sendTelemetryToServer(float tds, float voltage, int rawAdc) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    http.begin(client, SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Construct JSON payload
    String jsonPayload = "{";
    jsonPayload += "\\"deviceId\\":\\"" + String(DEVICE_ID) + "\\",";
    jsonPayload += "\\"tds\\":" + String(tds, 1) + ",";
    jsonPayload += "\\"voltage\\":" + String(voltage, 3) + ",";
    jsonPayload += "\\"temperature\\":" + String(temperature, 1) + ",";
    jsonPayload += "\\"rawAdc\\":" + String(rawAdc);
    jsonPayload += "}";

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("[HTTP] Server Response code: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println("[HTTP] Response: " + response);
    } else {
      Serial.print("[HTTP] Error sending POST: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("[Wi-Fi] Disconnected, unable to transmit telemetry.");
  }
}
`;
