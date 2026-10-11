import React, { useState } from 'react';
import { useHardware } from '../context/HardwareContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  FileText,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export const ReportsView: React.FC = () => {
  const { activeDeviceId, activeDevice, latestReading, wqi } = useHardware();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadPDF = () => {
    setDownloading('PDF');
    const url = api.getPdfReportUrl(activeDeviceId);
    window.open(url, '_blank');
    setTimeout(() => setDownloading(null), 1500);
  };

  const handleDownloadCSV = () => {
    setDownloading('CSV');
    const url = api.getCsvReportUrl(activeDeviceId, '24h');
    window.open(url, '_blank');
    setTimeout(() => setDownloading(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Official Water Quality Analysis & Compliance Reports
          </h2>
          <p className="text-xs text-slate-400">
            Generate formal parameter audits, calibration records, threshold violation logs, and raw CSV dumps
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2.5 rounded-xl bg-dark-850 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold flex items-center space-x-2 transition-all shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{downloading === 'CSV' ? 'Exporting...' : 'Export CSV Dataset'}</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold text-xs flex items-center space-x-2 shadow-glow-cyan transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'PDF' ? 'Generating PDF...' : 'Download Official PDF Report'}</span>
          </button>
        </div>
      </div>

      <ErrorBoundary fallbackTitle="Unable to load Diagnostic Report Preview">
        <div className="glass-panel p-8 space-y-8 border-slate-700/60 max-w-4xl mx-auto">
          <div className="border-b border-slate-800 pb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-widest mb-1">
                <span>IoT Environmental Telemetry Audit</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Water Quality & Content Diagnostic Report
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Generated automatically by AquaSense IoT Real-Time Ingestion Engine
              </p>
            </div>

            <div className="text-right text-xs text-slate-400 space-y-1">
              <p>Report Date: <strong className="text-white">{new Date().toLocaleDateString()}</strong></p>
              <p>Time: <strong className="text-white">{new Date().toLocaleTimeString()}</strong></p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                VERIFIED SYSTEM AUDIT
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Hardware & Target Endpoint Metadata
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-dark-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">DEVICE ID</span>
                <strong className="text-cyan-400 font-mono text-sm">{activeDeviceId}</strong>
              </div>
              <div className="p-3 bg-dark-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">DEVICE NAME</span>
                <strong className="text-white text-sm">{activeDevice?.deviceName || 'Water Quality Analyzer'}</strong>
              </div>
              <div className="p-3 bg-dark-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">HARDWARE STATUS</span>
                <strong className={activeDevice?.status === 'ONLINE' ? 'text-emerald-400 text-sm' : 'text-rose-400 text-sm'}>
                  {activeDevice?.status || 'OFFLINE'}
                </strong>
              </div>
              <div className="p-3 bg-dark-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">FIRMWARE</span>
                <strong className="text-slate-200 font-mono text-sm">{activeDevice?.firmwareVersion || '1.0.4-PROD'}</strong>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              2. Monitored Parameter Classification & WQI Score
            </h3>

            <div className="p-5 rounded-2xl bg-dark-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center space-x-5">
                <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-2xl font-black font-mono ${
                  wqi?.status === 'GOOD' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  wqi?.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                  wqi?.status === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                  'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {wqi?.score ?? '--'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-bold text-slate-400">Classification:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      wqi?.status === 'GOOD' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      wqi?.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      wqi?.status === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {wqi?.status ?? 'UNAVAILABLE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-md">
                    {wqi?.message || 'Measured parameters are currently within the configured limits.'}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 max-w-xs text-right">
                Disclaimer: This system is a monitoring and analysis tool, not a laboratory certification system.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Monitored Parameters Evaluation Table
            </h3>

            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-dark-900 text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Parameter</th>
                  <th className="py-3 px-4">Observed Value</th>
                  <th className="py-3 px-4">Standard Safe Range</th>
                  <th className="py-3 px-4">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-dark-850/60 font-mono">
                {[
                  {
                    name: 'pH Level',
                    val: latestReading?.ph !== null && latestReading?.ph !== undefined ? `${latestReading.ph.toFixed(2)} pH` : null,
                    safe: '6.50 – 8.50 pH',
                    ok: latestReading?.ph !== null && latestReading?.ph !== undefined && latestReading.ph >= 6.5 && latestReading.ph <= 8.5
                  },
                  {
                    name: 'Water Temperature',
                    val: latestReading?.temperature !== null && latestReading?.temperature !== undefined ? `${latestReading.temperature.toFixed(1)} °C` : null,
                    safe: '15.0 – 30.0 °C',
                    ok: latestReading?.temperature !== null && latestReading?.temperature !== undefined && latestReading.temperature >= 15 && latestReading.temperature <= 30
                  },
                  {
                    name: 'Total Dissolved Solids (TDS)',
                    val: latestReading?.tds !== null && latestReading?.tds !== undefined ? `${latestReading.tds.toFixed(0)} ppm` : null,
                    safe: '< 500 ppm',
                    ok: latestReading?.tds !== null && latestReading?.tds !== undefined && latestReading.tds <= 500
                  },
                  {
                    name: 'Turbidity (Optical)',
                    val: latestReading?.turbidity !== null && latestReading?.turbidity !== undefined ? `${latestReading.turbidity.toFixed(2)} NTU` : null,
                    safe: '< 5.00 NTU',
                    ok: latestReading?.turbidity !== null && latestReading?.turbidity !== undefined && latestReading.turbidity <= 5.0
                  },
                  {
                    name: 'Conductivity (EC)',
                    val: latestReading?.ec !== null && latestReading?.ec !== undefined ? `${latestReading.ec.toFixed(0)} µS/cm` : null,
                    safe: '< 800 µS/cm',
                    ok: latestReading?.ec !== null && latestReading?.ec !== undefined && latestReading.ec <= 800
                  },
                  {
                    name: 'Water Level',
                    val: latestReading?.waterLevel !== null && latestReading?.waterLevel !== undefined ? `${latestReading.waterLevel.toFixed(1)} %` : null,
                    safe: '> 20.0 %',
                    ok: latestReading?.waterLevel !== null && latestReading?.waterLevel !== undefined && latestReading.waterLevel >= 20
                  }
                ].map((row) => (
                  <tr key={row.name}>
                    <td className="py-3 px-4 font-sans font-medium text-white">{row.name}</td>
                    <td className="py-3 px-4 font-bold text-cyan-300">{row.val ?? 'Not Connected'}</td>
                    <td className="py-3 px-4 text-slate-400 font-sans">{row.safe}</td>
                    <td className="py-3 px-4 font-sans">
                      {row.val === null ? (
                        <span className="text-[11px] font-semibold text-slate-500">Unavailable</span>
                      ) : row.ok ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Normal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                          <AlertCircle className="w-3.5 h-3.5" /> Anomaly
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
