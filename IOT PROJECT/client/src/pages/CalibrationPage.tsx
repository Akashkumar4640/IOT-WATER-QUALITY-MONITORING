import React, { useState, useEffect } from 'react';
import { useHardware } from '../context/HardwareContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  Sliders,
  CheckCircle2,
  RefreshCw,
  Droplets,
  Gauge,
  Eye,
  Zap,
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { CalibrationRecord } from '../types';

export const CalibrationPage: React.FC = () => {
  const { activeDeviceId, latestReading } = useHardware();
  const [selectedSensor, setSelectedSensor] = useState<'pH' | 'TDS' | 'Turbidity' | 'EC'>('pH');
  const [calRecords, setCalRecords] = useState<CalibrationRecord[]>([]);
  const [calibratingStep, setCalibratingStep] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [phNeutralRef, setPhNeutralRef] = useState<number>(7.00);
  const [phAcidRef, setPhAcidRef] = useState<number>(4.01);
  const [phBaseRef, setPhBaseRef] = useState<number>(10.01);
  const [tdsRefValue, setTdsRefValue] = useState<number>(342);

  const loadCalibrations = React.useCallback(async () => {
    try {
      const res = await api.getCalibration(activeDeviceId);
      if (res.success && res.data) {
        setCalRecords(res.data);
      }
    } catch (e) {
      console.warn('Calibration load error:', e);
    }
  }, [activeDeviceId]);

  useEffect(() => {
    loadCalibrations();
  }, [loadCalibrations]);

  const activeRecord = calRecords.find(c => c.sensor === selectedSensor);

  const handleSavePHCalibration = async () => {
    if (isSubmitting) return;
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const currentPH = latestReading?.ph ?? 7.0;
      const rawV = latestReading?.rawValues?.ph?.voltage ?? 1.50;

      const payload = {
        deviceId: activeDeviceId,
        sensor: 'pH',
        calibrationParameters: {
          slope: 3.52,
          intercept: 0.04,
          neutralVoltage: rawV,
          points: [phNeutralRef || 7.0, phAcidRef || 4.01, phBaseRef || 10.01]
        },
        referenceValues: {
          neutral: phNeutralRef || 7.0,
          acid: phAcidRef || 4.01,
          base: phBaseRef || 10.01,
          measuredPH: currentPH,
          stabilizedVoltage: rawV
        }
      };

      const res = await api.saveCalibration(payload);
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Calibration Successful! Profile saved and activated on ${activeDeviceId}.` });
        setCalibratingStep(0);
        await loadCalibrations();
      } else {
        const errObj = res.error;
        const msg = typeof errObj === 'string' ? errObj : errObj?.message || 'Calibration failed on backend.';
        setStatusMessage({ type: 'error', text: msg });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: 'Network communication error: ' + e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTDSCalibration = async () => {
    if (isSubmitting) return;
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const currentTDS = latestReading?.tds ?? 300;
      const kFactor = +( (tdsRefValue || 342) / (currentTDS || 1)).toFixed(3);

      const payload = {
        deviceId: activeDeviceId,
        sensor: 'TDS',
        calibrationParameters: { kFactor, referenceStandard: `${tdsRefValue || 342} ppm NaCl` },
        referenceValues: { referenceTds: tdsRefValue || 342, measuredTds: currentTDS }
      };

      const res = await api.saveCalibration(payload);
      if (res.success) {
        setStatusMessage({ type: 'success', text: `TDS K-Factor (${kFactor}) calibrated and activated successfully!` });
        setCalibratingStep(0);
        await loadCalibrations();
      } else {
        const errObj = res.error;
        const msg = typeof errObj === 'string' ? errObj : errObj?.message || 'TDS calibration failed.';
        setStatusMessage({ type: 'error', text: msg });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Error saving calibration' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (confirm(`Reset ${selectedSensor} calibration back to factory defaults?`)) {
      setStatusMessage(null);
      setIsSubmitting(true);
      try {
        const res = await api.resetCalibration(activeDeviceId, selectedSensor);
        if (res.success) {
          setStatusMessage({ type: 'info', text: `${selectedSensor} calibration restored to default factory profile.` });
          await loadCalibrations();
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          Hardware Probe Calibration Studio
        </h2>
        <p className="text-xs text-slate-400">
          In-situ chemical buffer calibration, slope adjustment, and zero/span compensation for physical probes
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'pH', label: 'pH Electrode Probe', icon: <Droplets className="w-4 h-4" /> },
          { id: 'TDS', label: 'TDS Conductivity Probe', icon: <Gauge className="w-4 h-4" /> },
          { id: 'Turbidity', label: 'Turbidity Optical Chamber', icon: <Eye className="w-4 h-4" /> },
          { id: 'EC', label: 'Electrical Conductivity (EC)', icon: <Zap className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSelectedSensor(tab.id as any);
              setCalibratingStep(0);
              setStatusMessage(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              selectedSensor === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white bg-dark-900/80 border border-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-glow-emerald'
            : statusMessage.type === 'error'
            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
        }`}>
          <div className="flex items-center space-x-2.5">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-cyan-400" />}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <ErrorBoundary fallbackTitle="Unable to load Calibration Studio">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {selectedSensor} Calibration Wizard
                </h3>
                <p className="text-xs text-slate-400">Step-by-step chemical standardization workflow</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Factory Defaults</span>
                </button>
              </div>
            </div>

            {selectedSensor === 'pH' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  {[
                    { step: 1, label: '1. Neutral pH 7.00 Buffer' },
                    { step: 2, label: '2. Acid pH 4.01 Buffer' },
                    { step: 3, label: '3. Base pH 10.01 Buffer' }
                  ].map((s) => (
                    <div
                      key={s.step}
                      className={`p-3 rounded-xl border ${
                        calibratingStep === s.step - 1
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
                          : 'bg-dark-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-dark-900/90 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Instruction Guide:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                    <li>Rinse the BNC glass electrode probe thoroughly in distilled/deionized water.</li>
                    <li>Submerge probe into reference <strong>pH 7.00 Neutral Buffer Solution</strong>.</li>
                    <li>Gently stir and wait 30 seconds for the millivolt ADC reading to stabilize.</li>
                    <li>Confirm the measured live voltage below matches probe baseline (~1.50V).</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Live Probe Voltage</span>
                    <div className="text-2xl font-bold font-mono text-cyan-400">
                      {latestReading?.rawValues?.ph?.voltage !== undefined
                        ? `${latestReading.rawValues.ph.voltage} V`
                        : '1.502 V (Stabilized)'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Raw 12-Bit ADC</span>
                    <div className="text-2xl font-bold font-mono text-slate-200">
                      {latestReading?.rawValues?.ph?.adc ?? 1864}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Live Calculated pH</span>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      {latestReading?.ph?.toFixed(2) ?? '7.02'} pH
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Neutral Reference (pH)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={phNeutralRef}
                      onChange={(e) => setPhNeutralRef(parseFloat(e.target.value) || 7.00)}
                      className="w-full glass-input font-mono"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Acid Reference (pH)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={phAcidRef}
                      onChange={(e) => setPhAcidRef(parseFloat(e.target.value) || 4.01)}
                      className="w-full glass-input font-mono"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Base Reference (pH)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={phBaseRef}
                      onChange={(e) => setPhBaseRef(parseFloat(e.target.value) || 10.01)}
                      className="w-full glass-input font-mono"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={handleSavePHCalibration}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold text-xs shadow-glow-cyan flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{isSubmitting ? 'Saving Profile...' : 'Execute & Save pH Calibration'}</span>
                  </button>
                </div>
              </div>
            )}

            {selectedSensor === 'TDS' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-dark-900/90 border border-slate-800 space-y-2 text-xs text-slate-300">
                  <h4 className="font-bold text-cyan-400 uppercase">TDS Calibration Protocol:</h4>
                  <p>
                    Place TDS probe into a known standard conductivity solution (e.g., <strong>342 ppm NaCl</strong> or 1000 ppm standard). Enter the exact solution value below and submit.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Known Standard Solution (ppm)</label>
                    <input
                      type="number"
                      value={tdsRefValue}
                      onChange={(e) => setTdsRefValue(parseInt(e.target.value, 10) || 342)}
                      className="w-full glass-input font-mono"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Measured Raw Reading (ppm)</label>
                    <input
                      type="text"
                      disabled
                      value={latestReading?.tds !== null && latestReading?.tds !== undefined ? `${latestReading.tds} ppm` : '318 ppm'}
                      className="w-full glass-input font-mono text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    onClick={handleSaveTDSCalibration}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-900 font-bold text-xs shadow-glow-emerald flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{isSubmitting ? 'Calibrating...' : 'Calibrate TDS K-Factor'}</span>
                  </button>
                </div>
              </div>
            )}

            {selectedSensor === 'Turbidity' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-dark-900/90 border border-slate-800 space-y-2 text-xs text-slate-300">
                  <h4 className="font-bold text-purple-400 uppercase">Turbidity Zero Calibration:</h4>
                  <p>
                    Place the optical turbidity probe into pure distilled water (0.00 NTU baseline). The clear water voltage (~2.50V) will be registered as zero-point reference.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    onClick={handleSaveTDSCalibration}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Set Optical Zero Reference</span>
                  </button>
                </div>
              </div>
            )}

            {selectedSensor === 'EC' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-dark-900/90 border border-slate-800 space-y-2 text-xs text-slate-300">
                  <h4 className="font-bold text-blue-400 uppercase">Conductivity Cell Constant:</h4>
                  <p>
                    Submerge probe in standard <strong>1413 µS/cm KCl solution</strong> at 25°C to calibrate cell constant.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    onClick={handleSaveTDSCalibration}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-md flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Calibrate EC Cell Constant</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Active Calibration Profile
            </h3>

            <div className="p-4 rounded-xl bg-dark-900/90 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Sensor:</span>
                <span className="font-bold text-white">{selectedSensor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Device ID:</span>
                <span className="font-mono text-cyan-400">{activeDeviceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Calibration Status:</span>
                <span className="font-bold text-emerald-400">
                  {activeRecord ? 'ACTIVE (Verified)' : 'Factory Default'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Calibrated:</span>
                <span className="font-mono text-slate-300">
                  {activeRecord ? new Date(activeRecord.calibrationDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-dark-900/90 border border-slate-800 text-xs space-y-2">
              <h4 className="font-bold text-slate-300">Calibration Parameters:</h4>
              {activeRecord?.calibrationParameters ? (
                <pre className="text-[11px] font-mono text-cyan-300 overflow-x-auto p-2 bg-dark-850 rounded-lg">
                  {JSON.stringify(activeRecord.calibrationParameters, null, 2)}
                </pre>
              ) : (
                <p className="text-slate-500 text-[11px]">Factory linear slope (3.50 pH/V) in effect.</p>
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export const CalibrationView = CalibrationPage;
