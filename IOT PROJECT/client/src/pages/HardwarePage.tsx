import React from 'react';
import { useHardware } from '../context/HardwareContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  Cpu,
  Wifi,
  Server,
  Database,
  Monitor,
  Droplets,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const HardwarePage: React.FC = () => {
  const {
    latestReading,
    deviceStatus,
    sensorsConnectedCount
  } = useHardware();

  const isOnline = deviceStatus === 'ONLINE';

  const pipelineNodes = [
    {
      step: 1,
      title: 'Water Sample',
      desc: 'Physical Fluid Matrix',
      icon: <Droplets className="w-5 h-5 text-cyan-400" />,
      status: 'ACTIVE',
      statusText: 'In-Situ Sample'
    },
    {
      step: 2,
      title: 'Sensors Array',
      desc: 'pH, Temp, TDS, Turbidity, EC',
      icon: <Layers className="w-5 h-5 text-emerald-400" />,
      status: sensorsConnectedCount > 0 ? 'ACTIVE' : 'WARNING',
      statusText: `${sensorsConnectedCount} / 5 Online`
    },
    {
      step: 3,
      title: 'ESP32 Core',
      desc: 'ADC Sampling & Flash NVS',
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      status: isOnline ? 'ACTIVE' : 'ERROR',
      statusText: isOnline ? 'FreeRTOS Loop' : 'Offline'
    },
    {
      step: 4,
      title: 'Wi-Fi Network',
      desc: '802.11 b/g/n / LAN',
      icon: <Wifi className="w-5 h-5 text-blue-400" />,
      status: isOnline ? 'ACTIVE' : 'ERROR',
      statusText: isOnline ? 'Connected' : 'Link Lost'
    },
    {
      step: 5,
      title: 'Node.js Server',
      desc: 'REST API & Alert Engine',
      icon: <Server className="w-5 h-5 text-amber-400" />,
      status: 'ACTIVE',
      statusText: 'Port 5000'
    },
    {
      step: 6,
      title: 'SQLite DB',
      desc: 'ACID Persistent Telemetry',
      icon: <Database className="w-5 h-5 text-pink-400" />,
      status: 'ACTIVE',
      statusText: 'Synchronized'
    },
    {
      step: 7,
      title: 'Real-Time UI',
      desc: 'WebSocket Stream',
      icon: <Monitor className="w-5 h-5 text-cyan-400" />,
      status: 'ACTIVE',
      statusText: 'Socket.IO Active'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          Hardware Architecture & End-to-End Pipeline
        </h2>
        <p className="text-xs text-slate-400">
          Visual data-flow path from physical chemical sensors through ESP32 microcontroller to real-time dashboard
        </p>
      </div>

      <ErrorBoundary fallbackTitle="Unable to load System Telemetry Pipeline">
        <div className="glass-panel p-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">
            End-to-End System Telemetry Pipeline
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 relative">
            {pipelineNodes.map((node, idx) => (
              <div key={node.step} className="flex flex-col items-center text-center relative group">
                <div className={`w-full p-4 rounded-2xl border transition-all ${
                  node.status === 'ACTIVE'
                    ? 'bg-dark-900/90 border-slate-700/80 shadow-md group-hover:border-cyan-500/50'
                    : node.status === 'WARNING'
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-dark-850 flex items-center justify-center mx-auto mb-2.5 border border-slate-800 shadow-inner">
                    {node.icon}
                  </div>
                  <h4 className="text-xs font-bold text-white mb-0.5">{node.title}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">{node.desc}</p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    node.status === 'ACTIVE'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : node.status === 'WARNING'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {node.statusText}
                  </span>
                </div>

                {idx < pipelineNodes.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 transform -translate-y-1/2 z-10 text-cyan-400">
                    <ArrowRight className="w-4 h-4 opacity-70 animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Unable to load Hardware Pinout Matrix">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Live Sensor Interfacing Status
            </h3>

            <div className="space-y-3">
              {[
                { name: 'pH Sensor (BNC Probe)', pin: 'GPIO 34 (ADC1_CH6)', val: latestReading?.ph, unit: 'pH', conn: latestReading?.ph !== null && latestReading?.ph !== undefined },
                { name: 'Water Temperature (DS18B20)', pin: 'GPIO 4 (1-Wire Digital)', val: latestReading?.temperature, unit: '°C', conn: latestReading?.temperature !== null && latestReading?.temperature !== undefined },
                { name: 'Total Dissolved Solids (TDS)', pin: 'GPIO 35 (ADC1_CH7)', val: latestReading?.tds, unit: 'ppm', conn: latestReading?.tds !== null && latestReading?.tds !== undefined },
                { name: 'Turbidity Optical Sensor', pin: 'GPIO 32 (ADC1_CH4)', val: latestReading?.turbidity, unit: 'NTU', conn: latestReading?.turbidity !== null && latestReading?.turbidity !== undefined },
                { name: 'Conductivity (EC)', pin: 'GPIO 33 (ADC1_CH5)', val: latestReading?.ec, unit: 'µS/cm', conn: latestReading?.ec !== null && latestReading?.ec !== undefined },
                { name: 'Water Level Sensor', pin: 'GPIO 36 (ADC1_CH0)', val: latestReading?.waterLevel, unit: '%', conn: latestReading?.waterLevel !== null && latestReading?.waterLevel !== undefined }
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-dark-900/70 border border-slate-800 text-xs">
                  <div>
                    <h5 className="font-bold text-white">{s.name}</h5>
                    <span className="text-[10px] text-slate-500 font-mono">{s.pin}</span>
                  </div>
                  <div className="text-right">
                    {s.conn ? (
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-cyan-300">
                          {s.val} {s.unit}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Connected
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Not Connected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Microcontroller Specs & Pinout Safety
            </h3>

            <div className="p-4 rounded-xl bg-dark-900/80 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Microcontroller Model:</span>
                <span className="font-mono text-white font-bold">ESP32-WROOM-32 (Dual Core 240MHz)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ADC Sampling Resolution:</span>
                <span className="font-mono text-cyan-400">12-Bit (0 – 4095)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ADC Attenuation:</span>
                <span className="font-mono text-slate-200">11dB (0.0V – 3.3V Full Scale)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Digital 1-Wire Pullup:</span>
                <span className="font-mono text-slate-200">4.7 kΩ between GPIO4 & 3.3V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sampling Rate:</span>
                <span className="font-mono text-emerald-400">Every 5,000 ms</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
              <h5 className="font-bold mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> 3.3V ADC Safety Notice
              </h5>
              <p className="text-[11px] text-slate-300">
                Ensure 5V analog boards pass through a 1kΩ / 2kΩ voltage divider before entering ESP32 pins. Use ADC1 pins (GPIO 32–39) only to avoid Wi-Fi radio conflicts.
              </p>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export const HardwareView = HardwarePage;
