import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Droplets,
  History,
  BarChart3,
  AlertTriangle,
  Cpu,
  Server,
  Sliders,
  Terminal,
  FileText,
  Settings,
  Waves,
  TestTube,
  BrainCircuit,
  ShieldCheck,
  FlaskConical
} from 'lucide-react';
import { useHardware } from '../../context/HardwareContext';

export type ViewType =
  | 'dashboard'
  | 'live-tds'
  | 'tds-checker'
  | 'live'
  | 'analysis'
  | 'history'
  | 'analytics'
  | 'alerts'
  | 'hardware'
  | 'devices'
  | 'calibration'
  | 'samples'
  | 'ai-analysis'
  | 'data-quality'
  | 'diagnostics'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const { activeAlerts, deviceStatus } = useHardware();

  const navItems: { id: ViewType; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'live-tds', label: 'Live TDS Monitor', icon: <Activity className="w-4 h-4 text-emerald-400" />, badge: 'LIVE' },
    { id: 'tds-checker', label: 'TDS Drinkability Checker', icon: <FlaskConical className="w-4 h-4 text-cyan-400" /> },
    { id: 'live', label: 'Live Monitoring', icon: <Activity className="w-4 h-4" /> },
    { id: 'analysis', label: 'Water Analysis', icon: <Droplets className="w-4 h-4" /> },
    { id: 'history', label: 'Sensor History', icon: <History className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { 
      id: 'alerts', 
      label: 'Alerts', 
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: activeAlerts.length > 0 ? activeAlerts.length : undefined
    },
    { id: 'ai-analysis', label: 'AI Intelligence', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'samples', label: 'Samples & Locations', icon: <TestTube className="w-4 h-4" /> },
    { id: 'data-quality', label: 'Data Quality', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'hardware', label: 'Hardware Pipeline', icon: <Cpu className="w-4 h-4" /> },
    { id: 'devices', label: 'Devices', icon: <Server className="w-4 h-4" /> },
    { id: 'calibration', label: 'Calibration Studio', icon: <Sliders className="w-4 h-4" /> },
    { id: 'diagnostics', label: 'Raw Diagnostics', icon: <Terminal className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];


  return (
    <aside className="w-64 bg-dark-850/95 border-r border-slate-800/80 flex flex-col justify-between p-4 min-h-screen sticky top-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-3 py-4 mb-4 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 flex items-center justify-center shadow-glow-cyan text-dark-900 font-bold">
            <Waves className="w-6 h-6 text-dark-900" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              AquaSense <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">IoT</span>
            </h1>
            <p className="text-[11px] text-slate-400">Water Quality Analyzer</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Card */}
      <div className="p-3 bg-dark-900/80 rounded-xl border border-slate-800/80 mt-6">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400">ESP32 Core</span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
            deviceStatus === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${deviceStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse-dot' : 'bg-rose-500'}`}></span>
            {deviceStatus}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono truncate">v1.0.4 • ESP32-WROOM-32</p>
      </div>
    </aside>
  );
};
