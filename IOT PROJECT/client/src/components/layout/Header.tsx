import React, { useState, useEffect } from 'react';
import { useHardware } from '../../context/HardwareContext';
import {
  Wifi,
  WifiOff,
  Cpu,
  RefreshCw,
  AlertTriangle,
  Server
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeDeviceId,
    setActiveDeviceId,
    devices,
    isDemoMode,
    setIsDemoMode,
    deviceStatus,
    lastPacketTime,
    backendConnected,
    socketConnected,
    sensorsConnectedCount,
    activeAlerts
  } = useHardware();

  const [timeAgo, setTimeAgo] = useState<string>('Never');

  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastPacketTime) {
        setTimeAgo('No data');
        return;
      }
      const seconds = Math.floor((Date.now() - lastPacketTime.getTime()) / 1000);
      if (seconds < 2) setTimeAgo('Just now');
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      else setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastPacketTime]);

  return (
    <header className="h-16 bg-dark-850/80 backdrop-blur-xl border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-dark-900/90 border border-slate-700/60 rounded-xl px-3 py-1.5">
          <Server className="w-4 h-4 text-cyan-400" />
          <select
            value={activeDeviceId}
            onChange={(e) => setActiveDeviceId(e.target.value)}
            aria-label="Active Hardware Device"
            className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer pr-2"
          >
            {devices.length === 0 ? (
              <option value={activeDeviceId} className="bg-dark-900 text-slate-100">
                {activeDeviceId} (Default)
              </option>
            ) : (
              devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId} className="bg-dark-900 text-slate-100">
                  {d.deviceName} ({d.deviceId})
                </option>
              ))
            )}
          </select>
        </div>

        {isDemoMode ? (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>SIMULATED DATA (Demo Mode)</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></span>
            <span>LIVE ESP32 (Hardware Mode)</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-5 text-xs text-slate-400 border-r border-slate-800/80 pr-5">
          <div className="flex items-center space-x-1.5">
            {deviceStatus === 'ONLINE' ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-rose-400" />
            )}
            <span className="font-medium">
              {deviceStatus === 'ONLINE' ? 'ESP32: Online' : 'ESP32: Offline'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${backendConnected && socketConnected ? 'bg-emerald-400 animate-pulse-dot' : 'bg-rose-500'}`}></span>
            <span className="text-[11px] text-slate-300">
              {backendConnected && socketConnected ? 'Live Stream' : 'Connecting...'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-slate-500" />
            <span>Sensors:</span>
            <span className="font-semibold text-slate-200">
              {sensorsConnectedCount} / 5
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>Last Packet:</span>
            <span className="font-mono text-slate-200">{timeAgo}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-dark-900/90 border border-slate-700/60 p-1 rounded-xl">
          <button
            onClick={() => setIsDemoMode(false)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              !isDemoMode
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hardware
          </button>
          <button
            onClick={() => setIsDemoMode(true)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              isDemoMode
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Demo
          </button>
        </div>

        {activeAlerts.length > 0 && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{activeAlerts.length} Active</span>
          </div>
        )}
      </div>
    </header>
  );
};
