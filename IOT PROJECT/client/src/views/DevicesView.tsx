import React, { useState } from 'react';
import { useHardware } from '../context/HardwareContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  Server,
  Plus,
  Trash2,
  Key,
  Cpu,
  Copy,
  Check,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { Device } from '../types';

export const DevicesView: React.FC = () => {
  const { devices, refreshDevices, activeDeviceId, setActiveDeviceId } = useHardware();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newDeviceId, setNewDeviceId] = useState<string>('');
  const [newDeviceName, setNewDeviceName] = useState<string>('');
  const [newDeviceToken, setNewDeviceToken] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId.trim() || !newDeviceName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await api.registerDevice({
        deviceId: newDeviceId.trim(),
        deviceName: newDeviceName.trim(),
        deviceToken: newDeviceToken.trim() || undefined
      });

      if (res.success) {
        setShowAddModal(false);
        setNewDeviceId('');
        setNewDeviceName('');
        setNewDeviceToken('');
        await refreshDevices();
      } else {
        const errObj = res.error;
        setFormError(typeof errObj === 'string' ? errObj : errObj?.message || 'Failed to register device');
      }
    } catch (e: any) {
      setFormError('Failed to register device: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (deviceId: string) => {
    if (confirm(`Are you sure you want to delete device ${deviceId}?`)) {
      await api.deleteDevice(deviceId);
      await refreshDevices();
    }
  };

  const copyToClipboard = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            ESP32 Microcontroller Fleet & Device Management
          </h2>
          <p className="text-xs text-slate-400">
            Register and manage ESP32 analyzer endpoints, hardware authentication tokens, and online states
          </p>
        </div>

        <button
          onClick={() => { setFormError(null); setShowAddModal(true); }}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold text-xs flex items-center space-x-1.5 shadow-glow-cyan transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add ESP32 Device</span>
        </button>
      </div>

      <ErrorBoundary fallbackTitle="Unable to load Device Cards">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {devices.map((device: Device) => {
            const isSelected = activeDeviceId === device.deviceId;
            const isOnline = device.status === 'ONLINE';

            return (
              <div
                key={device.id}
                className={`glass-panel p-5 relative border transition-all ${
                  isSelected
                    ? 'border-cyan-500/60 shadow-glow-cyan bg-dark-800/90'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl border ${
                      isOnline
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{device.deviceName}</h3>
                      <span className="text-[11px] font-mono text-cyan-400 font-semibold block">
                        {device.deviceId}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isOnline
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {device.status}
                  </span>
                </div>

                <div className="p-3 bg-dark-900/80 rounded-xl border border-slate-800/80 space-y-2 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Firmware Version:</span>
                    <span className="font-mono text-slate-200">{device.firmwareVersion || '1.0.4'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Interface:</span>
                    <span className="text-slate-200">{device.connectionType || 'Wi-Fi 802.11'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Seen:</span>
                    <span className="font-mono text-slate-300">{device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : 'Never'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Key className="w-3 h-3" /> Token:
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                        {device.deviceToken ? `${device.deviceToken.substring(0, 10)}...` : 'None'}
                      </span>
                      {device.deviceToken && (
                        <button
                          onClick={() => copyToClipboard(device.deviceToken, device.deviceId)}
                          className="text-slate-400 hover:text-cyan-400"
                          title="Copy Device Token"
                        >
                          {copiedToken === device.deviceId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setActiveDeviceId(device.deviceId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white bg-dark-900'
                    }`}
                  >
                    {isSelected ? 'Active Device' : 'Select Device'}
                  </button>

                  {devices.length > 1 && (
                    <button
                      onClick={() => handleDelete(device.deviceId)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
                      title="Delete Device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ErrorBoundary>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-cyan-500/30">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              Register New ESP32 Analyzer
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Device ID (Unique identifier)</label>
                <input
                  type="text"
                  placeholder="e.g. WQ-ESP32-002"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  className="w-full glass-input"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Device Friendly Name</label>
                <input
                  type="text"
                  placeholder="e.g. Reservoir Intake Analyzer"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full glass-input"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Custom API Token (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave blank to generate automatically"
                  value={newDeviceToken}
                  onChange={(e) => setNewDeviceToken(e.target.value)}
                  className="w-full glass-input font-mono"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold shadow-glow-cyan flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  <span>{isSubmitting ? 'Registering...' : 'Register Device'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
