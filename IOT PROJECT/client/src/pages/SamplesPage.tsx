import React, { useState, useEffect } from 'react';
import { useHardware } from '../context/HardwareContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import {
  TestTube,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  User,
  Layers,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import type { WaterSampleRecord, LocationComparisonItem } from '../types';

export const SamplesPage: React.FC = () => {
  const { activeDeviceId, latestReading } = useHardware();
  const [samples, setSamples] = useState<WaterSampleRecord[]>([]);
  const [comparisons, setComparisons] = useState<LocationComparisonItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'list' | 'comparison'>('list');

  // Form State
  const [formData, setFormData] = useState({
    sampleName: '',
    location: 'Borewell',
    collectedBy: 'Technician 1',
    notes: '',
    attachLiveReading: true
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sampleRes, compRes] = await Promise.all([
        api.getSamples(),
        api.getLocationComparison()
      ]);
      if (sampleRes.success && sampleRes.data) {
        setSamples(sampleRes.data);
      }
      if (compRes.success && compRes.data) {
        setComparisons(compRes.data);
      }
    } catch (err) {
      console.warn('Failed to load water samples:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sampleName.trim() || !formData.location.trim()) return;

    setSubmitting(true);
    try {
      const now = new Date();
      const payload = {
        sampleName: formData.sampleName,
        location: formData.location,
        collectionDate: now.toISOString().split('T')[0],
        collectionTime: now.toTimeString().split(' ')[0],
        collectedBy: formData.collectedBy,
        notes: formData.notes,
        deviceId: activeDeviceId,
        readingSnapshot: formData.attachLiveReading && latestReading ? {
          ph: latestReading.ph,
          temperature: latestReading.temperature,
          tds: latestReading.tds,
          turbidity: latestReading.turbidity,
          ec: latestReading.ec,
          waterLevel: latestReading.waterLevel,
          timestamp: latestReading.timestamp
        } : null
      };

      const res = await api.createSample(payload);
      if (res.success) {
        setShowAddModal(false);
        setFormData({
          sampleName: '',
          location: 'Borewell',
          collectedBy: 'Technician 1',
          notes: '',
          attachLiveReading: true
        });
        loadData();
      }
    } catch (err) {
      console.error('Failed to create water sample:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSample = async (id: number) => {
    if (!confirm('Are you sure you want to delete this water sample record?')) return;
    try {
      const res = await api.deleteSample(id);
      if (res.success) {
        setSamples(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete sample:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TestTube className="w-5 h-5 text-cyan-400" />
            Water Sample & Location Analysis
          </h2>
          <p className="text-xs text-slate-400">
            Catalog physical water samples, associate live IoT telemetry, and compare geographical water quality
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-dark-850 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'list'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Samples ({samples.length})
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'comparison'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Location Benchmark
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-dark-900 font-bold text-xs flex items-center gap-1.5 shadow-glow-cyan transition-all"
          >
            <Plus className="w-4 h-4" /> Log Water Sample
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <ErrorBoundary fallbackTitle="Unable to load sample registry">
          {loading && samples.length === 0 ? (
            <div className="glass-panel p-12 text-center text-xs text-slate-500 font-mono">
              Loading water sample records...
            </div>
          ) : samples.length === 0 ? (
            <EmptyState
              title="No Water Samples Registered"
              description="Register physical water samples from borewells, storage tanks, RO filtration lines, or surface water bodies to link with ESP32 sensor telemetry."
              actionText="Log First Water Sample"
              onAction={() => setShowAddModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {samples.map((s) => {
                const snapshot = s.readingSnapshot || {};
                return (
                  <div key={s.id} className="glass-panel p-5 relative group flex flex-col justify-between hover:border-cyan-500/30 transition-all">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                            {s.sampleId || `SMP-${s.id}`}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-1.5">{s.sampleName}</h3>
                        </div>
                        <button
                          onClick={() => handleDeleteSample(s.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Delete Sample"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Location: <strong className="text-slate-200">{s.location}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Date: {s.collectionDate || new Date(s.createdAt).toLocaleDateString()}</span>
                          <Clock className="w-3.5 h-3.5 text-slate-500 ml-2" />
                          <span>{s.collectionTime || '12:00:00'}</span>
                        </div>
                        {s.collectedBy && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>Logged By: <strong className="text-slate-300">{s.collectedBy}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Reading Snapshot Badge */}
                      <div className="p-3 rounded-xl bg-dark-900/80 border border-slate-800/80 space-y-2">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                          <span>Attached Telemetry</span>
                          <span className="text-cyan-400 font-mono">{s.deviceId || activeDeviceId}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-dark-950/60 p-1.5 rounded border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block">pH Level</span>
                            <span className="font-mono font-bold text-cyan-300">
                              {snapshot.ph !== undefined && snapshot.ph !== null ? Number(snapshot.ph).toFixed(2) : '--'}
                            </span>
                          </div>
                          <div className="bg-dark-950/60 p-1.5 rounded border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block">TDS (ppm)</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {snapshot.tds !== undefined && snapshot.tds !== null ? snapshot.tds : '--'}
                            </span>
                          </div>
                          <div className="bg-dark-950/60 p-1.5 rounded border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block">Turbidity (NTU)</span>
                            <span className="font-mono font-bold text-amber-300">
                              {snapshot.turbidity !== undefined && snapshot.turbidity !== null ? Number(snapshot.turbidity).toFixed(2) : '--'}
                            </span>
                          </div>
                          <div className="bg-dark-950/60 p-1.5 rounded border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block">Temp (°C)</span>
                            <span className="font-mono font-bold text-blue-300">
                              {snapshot.temperature !== undefined && snapshot.temperature !== null ? Number(snapshot.temperature).toFixed(1) : '--'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {s.notes && (
                      <p className="mt-3 text-[11px] text-slate-400 italic bg-dark-900/40 p-2 rounded border border-slate-800/40">
                        "{s.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ErrorBoundary>
      ) : (
        /* Location Benchmark Tab */
        <ErrorBoundary fallbackTitle="Unable to load location comparison">
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Cross-Location Water Quality Benchmark
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aggregated analytical comparison across water sample sources
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="p-2 rounded-xl bg-dark-900 text-slate-400 hover:text-cyan-400 border border-slate-800 text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {comparisons.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  No multi-location data available yet. Create samples across different locations (e.g., Borewell, Tank, RO Outlet) to compare.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                        <th className="py-3 px-4">Location Source</th>
                        <th className="py-3 px-4">Samples Tested</th>
                        <th className="py-3 px-4">Avg pH</th>
                        <th className="py-3 px-4">Avg TDS (ppm)</th>
                        <th className="py-3 px-4">Avg Turbidity (NTU)</th>
                        <th className="py-3 px-4">Avg Temp (°C)</th>
                        <th className="py-3 px-4">Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {comparisons.map((c, idx) => {
                        const isPhGood = c.avgPh !== null && c.avgPh >= 6.5 && c.avgPh <= 8.5;
                        const isTdsGood = c.avgTds !== null && c.avgTds <= 500;
                        const isTurbGood = c.avgTurbidity !== null && c.avgTurbidity <= 5.0;
                        const compliant = isPhGood && isTdsGood && isTurbGood;

                        return (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                              {c.location}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-300">{c.sampleCount}</td>
                            <td className="py-3.5 px-4 font-mono">
                              <span className={isPhGood ? 'text-cyan-400' : 'text-rose-400 font-bold'}>
                                {c.avgPh !== null ? Number(c.avgPh).toFixed(2) : '--'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <span className={isTdsGood ? 'text-emerald-400' : 'text-amber-400 font-bold'}>
                                {c.avgTds !== null ? Math.round(c.avgTds) : '--'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <span className={isTurbGood ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                                {c.avgTurbidity !== null ? Number(c.avgTurbidity).toFixed(2) : '--'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-blue-300">
                              {c.avgTemp !== null ? Number(c.avgTemp).toFixed(1) : '--'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                compliant
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}>
                                {compliant ? 'COMPLIANT' : 'ATTENTION REQ.'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* Log Water Sample Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-lg w-full bg-dark-900 border border-slate-700 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TestTube className="w-5 h-5 text-cyan-400" /> Log Water Sample
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSample} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sample Identifier / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Borewell North Inlet Sample 01"
                  value={formData.sampleName}
                  onChange={e => setFormData({ ...formData, sampleName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location Source *</label>
                  <select
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Borewell">Borewell</option>
                    <option value="Storage Tank">Storage Tank</option>
                    <option value="RO Outlet">RO Outlet</option>
                    <option value="Municipal Main">Municipal Main</option>
                    <option value="Lake / River">Lake / River</option>
                    <option value="Industrial Discharge">Industrial Discharge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Logged By</label>
                  <input
                    type="text"
                    value={formData.collectedBy}
                    onChange={e => setFormData({ ...formData, collectedBy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observation Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Water appears clear, sampled after 5-min pump flush."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Attach Current Live Telemetry</span>
                  <span className="text-[11px] text-slate-400">
                    Snapshots current pH ({latestReading?.ph ?? '--'}), TDS ({latestReading?.tds ?? '--'}), Turbidity ({latestReading?.turbidity ?? '--'})
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.attachLiveReading}
                  onChange={e => setFormData({ ...formData, attachLiveReading: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-dark-900 font-bold shadow-glow-cyan transition-all disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save Water Sample'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const SamplesView = SamplesPage;
