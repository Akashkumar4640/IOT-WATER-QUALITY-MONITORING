import React, { useState, useEffect } from 'react';
import { useHardware } from '../../context/HardwareContext';
import { Cpu, Wifi, Radio, Clock, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

export const HardwareStatusBanner: React.FC = () => {
  const {
    activeDeviceId,
    activeDevice,
    deviceStatus,
    lastPacketTime,
    isStale,
    isDemoMode,
    sensorsConnectedCount
  } = useHardware();

  const [timeAgo, setTimeAgo] = useState<string>('Never');

  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastPacketTime || isNaN(lastPacketTime.getTime())) {
        setTimeAgo('No packets received yet');
        return;
      }
      const seconds = Math.max(0, Math.floor((Date.now() - lastPacketTime.getTime()) / 1000));
      if (seconds < 2) setTimeAgo('Just now');
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      else setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastPacketTime]);

  const isOnline = deviceStatus === 'ONLINE';

  return (
    <div className={`glass-panel p-4 border transition-all duration-300 ${
      isOnline
        ? (isStale ? 'border-amber-500/30 bg-dark-800/90' : 'border-emerald-500/20 bg-dark-800/90')
        : 'border-rose-500/30 bg-rose-950/20 shadow-glow-rose'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className={`p-2.5 rounded-xl border ${
            isOnline
              ? (isStale ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400')
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Hardware Device</h4>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {activeDeviceId}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {activeDevice?.deviceName || 'ESP32 Water Quality Analyzer'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Status:</span>
            {isOnline ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></span>
                ONLINE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                OFFLINE
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 text-slate-300">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Connection:</span>
            <span className="font-medium">Wi-Fi (802.11 b/g/n)</span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-300">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Protocol:</span>
            <span className="font-medium">HTTP REST / MQTT</span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-300">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Sensors:</span>
            <span className="font-bold text-slate-100">{sensorsConnectedCount} / 5</span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-300">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Last Received:</span>
            <span className={`font-mono ${isStale ? 'text-amber-400 font-semibold' : 'text-cyan-300'}`}>
              {timeAgo} {isStale && '(Stale)'}
            </span>
          </div>
        </div>

        <div>
          {isOnline ? (
            isStale ? (
              <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-semibold px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>⚠️ Telemetry Outdated</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hardware Synced</span>
              </div>
            )
          ) : (
            <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-semibold px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{!isDemoMode ? 'Waiting for live hardware data' : 'Hardware offline'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
