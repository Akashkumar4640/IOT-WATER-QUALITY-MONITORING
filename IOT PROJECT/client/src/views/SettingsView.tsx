import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  Settings,
  Save,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { ParameterThresholds } from '../types';

export const SettingsView: React.FC = () => {
  const [thresholds, setThresholds] = useState<ParameterThresholds | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    api.getThresholds().then((res) => {
      if (isMounted) {
        if (res.success && res.data) {
          setThresholds(res.data);
        } else {
          const errObj = res.error;
          setErrorMessage(typeof errObj === 'string' ? errObj : errObj?.message || 'Failed to load settings');
        }
        setLoading(false);
      }
    }).catch((err) => {
      if (isMounted) {
        setErrorMessage(err.message || 'Error loading settings');
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thresholds || isSaving) return;

    // Validate inputs
    if (thresholds.ph.min >= thresholds.ph.max) {
      setErrorMessage('pH minimum limit must be strictly less than pH maximum limit.');
      return;
    }
    if (thresholds.temperature.min >= thresholds.temperature.max) {
      setErrorMessage('Temperature minimum limit must be less than maximum limit.');
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    setErrorMessage(null);

    try {
      const res = await api.updateThresholds(thresholds);
      if (res.success) {
        setSaveStatus('Threshold configurations updated and live alert engine reloaded!');
      } else {
        const errObj = res.error;
        setErrorMessage(typeof errObj === 'string' ? errObj : errObj?.message || 'Error saving settings');
      }
    } catch (e: any) {
      setErrorMessage('Network error: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !thresholds) {
    return (
      <div className="glass-panel p-12 text-center text-slate-500 font-mono text-xs">
        {errorMessage ? (
          <div className="text-rose-400 space-y-2">
            <p>{errorMessage}</p>
          </div>
        ) : (
          'Loading threshold settings...'
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          System Threshold & Anomaly Engine Configuration
        </h2>
        <p className="text-xs text-slate-400">
          Define normal operating ranges, warning alerts, and critical boundary limits for water parameters
        </p>
      </div>

      {saveStatus && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-glow-emerald">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveStatus}</span>
          </div>
          <button onClick={() => setSaveStatus(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <ErrorBoundary fallbackTitle="Unable to load Settings Form">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              pH Hydrogen-Ion Limits
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Optimal Min (pH)</label>
                <input
                  type="number"
                  step="0.1"
                  value={thresholds.ph.min}
                  onChange={(e) => setThresholds({ ...thresholds, ph: { ...thresholds.ph, min: parseFloat(e.target.value) || 6.5 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Optimal Max (pH)</label>
                <input
                  type="number"
                  step="0.1"
                  value={thresholds.ph.max}
                  onChange={(e) => setThresholds({ ...thresholds, ph: { ...thresholds.ph, max: parseFloat(e.target.value) || 8.5 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Critical Min (pH)</label>
                <input
                  type="number"
                  step="0.1"
                  value={thresholds.ph.criticalMin}
                  onChange={(e) => setThresholds({ ...thresholds, ph: { ...thresholds.ph, criticalMin: parseFloat(e.target.value) || 5.5 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Critical Max (pH)</label>
                <input
                  type="number"
                  step="0.1"
                  value={thresholds.ph.criticalMax}
                  onChange={(e) => setThresholds({ ...thresholds, ph: { ...thresholds.ph, criticalMax: parseFloat(e.target.value) || 9.5 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Water Temperature Limits (°C)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Optimal Min (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={thresholds.temperature.min}
                  onChange={(e) => setThresholds({ ...thresholds, temperature: { ...thresholds.temperature, min: parseFloat(e.target.value) || 15.0 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Optimal Max (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={thresholds.temperature.max}
                  onChange={(e) => setThresholds({ ...thresholds, temperature: { ...thresholds.temperature, max: parseFloat(e.target.value) || 30.0 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Critical Min (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={thresholds.temperature.criticalMin}
                  onChange={(e) => setThresholds({ ...thresholds, temperature: { ...thresholds.temperature, criticalMin: parseFloat(e.target.value) || 5.0 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Critical Max (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={thresholds.temperature.criticalMax}
                  onChange={(e) => setThresholds({ ...thresholds, temperature: { ...thresholds.temperature, criticalMax: parseFloat(e.target.value) || 45.0 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Total Dissolved Solids & Optical Turbidity Limits
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">TDS Warning (ppm)</label>
                <input
                  type="number"
                  value={thresholds.tds.warning}
                  onChange={(e) => setThresholds({ ...thresholds, tds: { ...thresholds.tds, warning: parseInt(e.target.value, 10) || 300 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">TDS Max (ppm)</label>
                <input
                  type="number"
                  value={thresholds.tds.max}
                  onChange={(e) => setThresholds({ ...thresholds, tds: { ...thresholds.tds, max: parseInt(e.target.value, 10) || 500 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Turbidity Warning (NTU)</label>
                <input
                  type="number"
                  step="0.5"
                  value={thresholds.turbidity.warning}
                  onChange={(e) => setThresholds({ ...thresholds, turbidity: { ...thresholds.turbidity, warning: parseFloat(e.target.value) || 5.0 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Turbidity Max (NTU)</label>
                <input
                  type="number"
                  step="0.5"
                  value={thresholds.turbidity.max}
                  onChange={(e) => setThresholds({ ...thresholds, turbidity: { ...thresholds.turbidity, max: parseFloat(e.target.value) || 10.0 } })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Hardware Watchdog Timeout
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Offline Watchdog Detection Threshold (Seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={thresholds.offlineTimeoutSeconds || 15}
                  onChange={(e) => setThresholds({ ...thresholds, offlineTimeoutSeconds: parseInt(e.target.value, 10) || 15 })}
                  className="w-full glass-input font-mono"
                  disabled={isSaving}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Device will be marked OFFLINE if no packet is received within this duration.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold text-xs flex items-center space-x-2 shadow-glow-cyan transition-all disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving Configurations...' : 'Save & Deploy Threshold Settings'}</span>
            </button>
          </div>
        </form>
      </ErrorBoundary>
    </div>
  );
};
