import React, { useState, useEffect } from 'react';
import { useHardware } from '../context/HardwareContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  TrendingUp,
  Cpu,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import type { AIEvaluationResult } from '../types';

export const AIAnalysisPage: React.FC = () => {
  const { activeDeviceId, latestReading } = useHardware();
  const [aiData, setAiData] = useState<AIEvaluationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'live' | 'sandbox'>('live');

  // Interactive Sandbox state
  const [sandboxParams, setSandboxParams] = useState({
    ph: 7.2,
    tds: 280,
    turbidity: 1.5,
    temperature: 25.0,
    ec: 400
  });
  const [sandboxResult, setSandboxResult] = useState<AIEvaluationResult | null>(null);
  const [evaluatingSandbox, setEvaluatingSandbox] = useState<boolean>(false);

  const fetchLiveAI = async () => {
    setLoading(true);
    try {
      const res = await api.getAIEvaluation(activeDeviceId);
      if (res.success && res.data) {
        setAiData(res.data);
      }
    } catch (err) {
      console.warn('AI Analysis fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAI();
  }, [activeDeviceId]);

  // Whenever live telemetry arrives, update AI inference if in live tab
  useEffect(() => {
    if (!latestReading) return;
    const evaluateTelemetry = async () => {
      try {
        const res = await api.evaluateCustom({
          ph: latestReading.ph,
          tds: latestReading.tds,
          turbidity: latestReading.turbidity,
          temperature: latestReading.temperature,
          ec: latestReading.ec
        });
        if (res.success && res.data) {
          setAiData(res.data);
        }
      } catch (e) {
        // silent fallback
      }
    };
    evaluateTelemetry();
  }, [latestReading]);

  // Sandbox evaluator
  const runSandboxEvaluation = async () => {
    setEvaluatingSandbox(true);
    try {
      const res = await api.evaluateCustom(sandboxParams);
      if (res.success && res.data) {
        setSandboxResult(res.data);
      }
    } catch (err) {
      console.warn('Sandbox evaluation failed:', err);
    } finally {
      setEvaluatingSandbox(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sandbox') {
      runSandboxEvaluation();
    }
  }, [sandboxParams, activeTab]);

  const activeResult = activeTab === 'live' ? aiData : sandboxResult;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            AI & Machine Learning Water Quality Intelligence
          </h2>
          <p className="text-xs text-slate-400">
            Multi-variate Random Forest classification, ionic anomaly detection, and early predictive warning
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-dark-850 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'live'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Live Inference
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Simulation Sandbox
            </button>
          </div>

          <button
            onClick={fetchLiveAI}
            className="p-2 rounded-xl bg-dark-900 text-slate-400 hover:text-purple-400 border border-slate-800 text-xs flex items-center gap-1"
            title="Re-run Inference"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Model & Classification Status Banner */}
      <ErrorBoundary fallbackTitle="Unable to load AI classification banner">
        <div className={`p-5 rounded-2xl border transition-all ${
          activeResult?.safetyLevel === 'SAFE'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
            : activeResult?.safetyLevel === 'MODERATE'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl border ${
                activeResult?.safetyLevel === 'SAFE'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : activeResult?.safetyLevel === 'MODERATE'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              }`}>
                {activeResult?.potable ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-dark-900/60 border border-slate-700">
                    AI CLASSIFICATION TIER
                  </span>
                  <span className="text-xs font-semibold opacity-80">
                    Confidence: <strong className="text-white font-mono">{activeResult?.confidence ?? 95}%</strong>
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  {activeResult?.prediction || (loading ? 'Running Multi-Variate Inference...' : 'Insufficient Telemetry Data')}
                </h3>
                <p className="text-xs opacity-90 mt-0.5">
                  Primary Vector: <strong className="text-white">{activeResult?.primaryFactor || 'Balanced ionic baseline'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-right">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Anomaly Index</span>
                <span className={`text-2xl font-extrabold font-mono ${
                  (activeResult?.anomalyScore || 0) < 20
                    ? 'text-emerald-400'
                    : (activeResult?.anomalyScore || 0) < 50
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {activeResult?.anomalyScore ?? 0}<span className="text-xs text-slate-400 font-normal"> / 100</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Potability Verdict</span>
                <span className={`text-sm font-bold uppercase px-3 py-1 rounded-lg border ${
                  activeResult?.potable
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}>
                  {activeResult?.potable ? 'Potable Water' : 'Non-Potable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>

      {/* Main Grid: Sandbox or Feature Importance */}
      {activeTab === 'sandbox' && (
        <div className="glass-panel p-6 border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" /> Interactive Simulation Sandbox
              </h3>
              <p className="text-xs text-slate-400">
                Adjust sensor parameters to observe real-time AI classification response and anomaly calculation
              </p>
            </div>
            <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/30">
              {evaluatingSandbox ? 'Calculating...' : 'Live Model Preview'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-dark-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">pH Level</span>
                <span className="font-mono font-bold text-cyan-400">{sandboxParams.ph.toFixed(1)} pH</span>
              </div>
              <input
                type="range"
                min={4.0}
                max={10.5}
                step={0.1}
                value={sandboxParams.ph}
                onChange={e => setSandboxParams({ ...sandboxParams, ph: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block text-right">Ideal: 6.5 - 8.5</span>
            </div>

            <div className="bg-dark-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">TDS (ppm)</span>
                <span className="font-mono font-bold text-emerald-400">{sandboxParams.tds} ppm</span>
              </div>
              <input
                type="range"
                min={50}
                max={1200}
                step={10}
                value={sandboxParams.tds}
                onChange={e => setSandboxParams({ ...sandboxParams, tds: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 block text-right">Ideal: &lt; 500</span>
            </div>

            <div className="bg-dark-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">Turbidity (NTU)</span>
                <span className="font-mono font-bold text-amber-400">{sandboxParams.turbidity.toFixed(1)} NTU</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={15.0}
                step={0.1}
                value={sandboxParams.turbidity}
                onChange={e => setSandboxParams({ ...sandboxParams, turbidity: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-slate-500 block text-right">Ideal: &lt; 5.0</span>
            </div>

            <div className="bg-dark-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">Temperature</span>
                <span className="font-mono font-bold text-blue-400">{sandboxParams.temperature.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min={10.0}
                max={45.0}
                step={0.5}
                value={sandboxParams.temperature}
                onChange={e => setSandboxParams({ ...sandboxParams, temperature: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <span className="text-[10px] text-slate-500 block text-right">Ideal: 15 - 30</span>
            </div>

            <div className="bg-dark-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">Conductivity (EC)</span>
                <span className="font-mono font-bold text-indigo-400">{sandboxParams.ec} µS/cm</span>
              </div>
              <input
                type="range"
                min={100}
                max={1600}
                step={20}
                value={sandboxParams.ec}
                onChange={e => setSandboxParams({ ...sandboxParams, ec: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500"
              />
              <span className="text-[10px] text-slate-500 block text-right">Ideal: &lt; 800</span>
            </div>
          </div>
        </div>
      )}

      {/* Feature Importance & Predictive Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Importance Breakdown */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" /> Multi-Feature Anomaly Contribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Model weights and deviation penalty contributions evaluated against WHO drinking water baselines
          </p>

          <div className="space-y-4">
            {(activeResult?.features || []).map((feat, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-dark-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{feat.name}</span>
                    <span className="font-mono text-slate-400">
                      ({feat.value} {feat.unit})
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-mono text-slate-400">
                      Weight: {(feat.importance * 100).toFixed(0)}%
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      feat.status === 'OPTIMAL' || feat.status === 'EXCELLENT' || feat.status === 'GOOD'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {feat.status}
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-dark-950 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 ${
                      feat.anomalyWeight > 50
                        ? 'bg-rose-500'
                        : feat.anomalyWeight > 20
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, feat.anomalyWeight)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Deviation Anomaly: {feat.anomalyWeight}%</span>
                  <span>Model Contribution: {((feat.anomalyWeight * feat.importance)).toFixed(1)} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Recommendations & Early Warning */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Actionable Prescriptions
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              AI-generated remediation advice based on chemical anomalies
            </p>

            <div className="space-y-3">
              {(activeResult?.recommendations || [
                'Ensure sensors are submerged in target water vessel.',
                'Perform 2-point pH buffer calibration if drift is suspected.'
              ]).map((rec, i) => (
                <div key={i} className="p-3 rounded-xl bg-dark-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-dark-950/60 p-3 rounded-xl border border-slate-800/60">
              <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Compliance Notice:</strong> AI predictions are deterministic mathematical estimates calibrated to WHO & EPA reference benchmarks for decision support and do not certify regulatory potability.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AIAnalysisView = AIAnalysisPage;
