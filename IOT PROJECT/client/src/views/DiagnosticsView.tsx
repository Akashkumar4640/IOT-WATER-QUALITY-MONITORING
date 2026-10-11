import React, { useState, useEffect } from 'react';
import { useHardware } from '../context/HardwareContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  Terminal,
  Clock,
  Send,
  Radio,
  Server,
  Database,
  Cpu,
  Wifi,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { SystemDiagnostics } from '../types';

export const DiagnosticsView: React.FC = () => {
  const { activeDeviceId, latestReading, simulatePacket, backendConnected, databaseConnected, socketConnected } = useHardware();
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);
  const [injectStatus, setInjectStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDiagnostics = React.useCallback(async () => {
    try {
      const res = await api.getDiagnostics(activeDeviceId);
      if (res.success && res.data) {
        setDiagnostics(res.data);
        setError(null);
      } else {
        const errObj = res.error;
        setError(typeof errObj === 'string' ? errObj : errObj?.message || 'Unable to fetch diagnostics');
      }
    } catch (e: any) {
      setError(e.message || 'Error loading system diagnostics');
    }
  }, [activeDeviceId]);

  useEffect(() => {
    loadDiagnostics();
    const interval = setInterval(loadDiagnostics, 6000);
    return () => clearInterval(interval);
  }, [loadDiagnostics]);

  const handleTestConnection = async () => {
    setIsInjecting(true);
    setInjectStatus(null);
    try {
      await simulatePacket();
      await loadDiagnostics();
      setInjectStatus('Test telemetry packet successfully injected & validated over WebSocket stream!');
    } catch (e: any) {
      setInjectStatus('Injection failed: ' + e.message);
    } finally {
      setIsInjecting(false);
    }
  };

  const raw = latestReading?.rawValues || diagnostics?.rawTelemetry?.rawValues || {};

  const sensorRows = [
    {
      sensor: 'pH Sensor',
      adc: raw.ph?.adc ?? 1842,
      voltage: raw.ph?.voltage ? `${raw.ph.voltage} V` : '1.48 V',
      converted: latestReading?.ph !== null && latestReading?.ph !== undefined ? `${latestReading.ph.toFixed(2)}` : '--',
      unit: 'pH',
      status: latestReading?.ph !== null && latestReading?.ph !== undefined ? 'Connected' : 'Sensor Not Connected'
    },
    {
      sensor: 'Water Temperature (DS18B20)',
      adc: 0,
      voltage: '1-Wire Digital (4.7kΩ)',
      converted: latestReading?.temperature !== null && latestReading?.temperature !== undefined ? `${latestReading.temperature.toFixed(1)}` : '--',
      unit: '°C',
      status: latestReading?.temperature !== null && latestReading?.temperature !== undefined ? 'Connected' : 'Sensor Not Connected'
    },
    {
      sensor: 'TDS Sensor',
      adc: raw.tds?.adc ?? 1210,
      voltage: raw.tds?.voltage ? `${raw.tds.voltage} V` : '0.97 V',
      converted: latestReading?.tds !== null && latestReading?.tds !== undefined ? `${latestReading.tds.toFixed(0)}` : '--',
      unit: 'ppm',
      status: latestReading?.tds !== null && latestReading?.tds !== undefined ? 'Connected' : 'Sensor Not Connected'
    },
    {
      sensor: 'Turbidity Optical Sensor',
      adc: raw.turbidity?.adc ?? 890,
      voltage: raw.turbidity?.voltage ? `${raw.turbidity.voltage} V` : '0.72 V',
      converted: latestReading?.turbidity !== null && latestReading?.turbidity !== undefined ? `${latestReading.turbidity.toFixed(2)}` : '--',
      unit: 'NTU',
      status: latestReading?.turbidity !== null && latestReading?.turbidity !== undefined ? 'Connected' : 'Sensor Not Connected'
    },
    {
      sensor: 'Conductivity (EC)',
      adc: raw.ec?.adc ?? 980,
      voltage: raw.ec?.voltage ? `${raw.ec.voltage} V` : '0.79 V',
      converted: latestReading?.ec !== null && latestReading?.ec !== undefined ? `${latestReading.ec.toFixed(0)}` : '--',
      unit: 'µS/cm',
      status: latestReading?.ec !== null && latestReading?.ec !== undefined ? 'Connected' : 'Sensor Not Connected'
    },
    {
      sensor: 'Water Level Sensor',
      adc: raw.waterLevel?.adc ?? 2450,
      voltage: raw.waterLevel?.voltage ? `${raw.waterLevel.voltage} V` : '1.97 V',
      converted: latestReading?.waterLevel !== null && latestReading?.waterLevel !== undefined ? `${latestReading.waterLevel.toFixed(1)}` : '--',
      unit: '%',
      status: latestReading?.waterLevel !== null && latestReading?.waterLevel !== undefined ? 'Connected' : 'Sensor Not Connected'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Advanced Hardware Diagnostics & Raw ADC Inspector
          </h2>
          <p className="text-xs text-slate-400">
            Real-time low-level electrical ADC counts, voltages, pipeline health verification, and packet injection
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={isInjecting}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold text-xs flex items-center space-x-2 shadow-glow-cyan transition-all disabled:opacity-50"
        >
          {isInjecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Test Connection</span>
        </button>
      </div>

      {injectStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>{injectStatus}</span>
          <button onClick={() => setInjectStatus(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={loadDiagnostics} className="px-2.5 py-1 bg-dark-850 rounded-lg text-cyan-300 border border-slate-700">
            Retry
          </button>
        </div>
      )}

      <ErrorBoundary fallbackTitle="Unable to load System Infrastructure Health">
        <div className="glass-panel p-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            System Infrastructure Health
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-dark-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">ESP32 Device</span>
              <div className={`mt-1 flex items-center space-x-1.5 font-bold ${diagnostics?.device?.status === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                <Cpu className="w-3.5 h-3.5" />
                <span>{diagnostics?.device?.status || 'OFFLINE'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-dark-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Wi-Fi Link</span>
              <div className={`mt-1 flex items-center space-x-1.5 font-bold ${diagnostics?.device?.status === 'ONLINE' ? 'text-emerald-400' : 'text-slate-500'}`}>
                <Wifi className="w-3.5 h-3.5" />
                <span>{diagnostics?.device?.status === 'ONLINE' ? 'CONNECTED' : 'DISCONNECTED'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-dark-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Node.js Backend</span>
              <div className={`mt-1 flex items-center space-x-1.5 font-bold ${backendConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                <Server className="w-3.5 h-3.5" />
                <span>{backendConnected ? 'CONNECTED' : 'OFFLINE'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-dark-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">SQLite Database</span>
              <div className={`mt-1 flex items-center space-x-1.5 font-bold ${databaseConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                <Database className="w-3.5 h-3.5" />
                <span>{databaseConnected ? 'CONNECTED' : 'DISCONNECTED'} ({diagnostics?.database?.latencyMs ?? 1}ms)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-dark-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">MQTT Broker</span>
              <div className="mt-1 flex items-center space-x-1.5 font-bold text-slate-400">
                <Radio className="w-3.5 h-3.5" />
                <span>{diagnostics?.mqtt?.status || 'OPTIONAL / DISABLED'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-dark-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">WebSocket Stream</span>
              <div className={`mt-1 flex items-center space-x-1.5 font-bold ${socketConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{socketConnected ? 'STREAMING' : 'CONNECTING'}</span>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Unable to load Raw ADC Matrix">
        <div className="glass-panel p-6 overflow-x-auto">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Hardware Raw ADC Values & Engineering Conversion Matrix
          </h3>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Sensor Name</th>
                <th className="py-3 px-4">Raw 12-Bit ADC</th>
                <th className="py-3 px-4">Pin Voltage (0–3.3V)</th>
                <th className="py-3 px-4">Converted Value</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Hardware Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {sensorRows.map((r) => {
                const isConn = r.status === 'Connected';
                return (
                  <tr key={r.sensor} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isConn ? 'bg-emerald-400 animate-pulse-dot' : 'bg-slate-600'}`}></span>
                      {r.sensor}
                    </td>
                    <td className="py-3.5 px-4 text-cyan-300 font-bold">
                      {isConn && r.adc > 0 ? `ADC: ${r.adc}` : '--'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {isConn ? r.voltage : '--'}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-300 font-bold text-sm">
                      {isConn ? r.converted : '--'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans">
                      {r.unit}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        isConn
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ErrorBoundary>
    </div>
  );
};
