import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  Cpu,
  Clock,
  ShieldAlert,
  RefreshCw,
  Copy,
  Check,
  Send,
  Radio,
  Server,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { api, type DirectTDSReading } from '../services/api';
import { getSocket } from '../services/socket';

export const LiveTDSMonitorPage: React.FC = () => {
  const [reading, setReading] = useState<DirectTDSReading | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Quick Hardware POST test form states
  const [testTds, setTestTds] = useState<string>('32');
  const [testRawAdc, setTestRawAdc] = useState<string>('23.4');
  const [testStatus, setTestStatus] = useState<string>('Normal TDS Range');
  const [testDeviceKey, setTestDeviceKey] = useState<string>('tds-demo-2026');
  const [testPosting, setTestPosting] = useState<boolean>(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  // Fetch GET /api/tds from server
  const fetchTdsReading = useCallback(async (manual: boolean = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const data = await api.getDirectTDS();
      if (!isMountedRef.current) return;

      if (data && (data.tds_ppm !== null || data.message || data.status !== null)) {
        setReading(data);
      } else {
        setReading({
          tds_ppm: null,
          raw_adc: null,
          status: null,
          updatedAt: null,
          message: 'Waiting for sensor data'
        });
      }
      setLastFetchTime(new Date());
    } catch (err) {
      console.error('Failed to fetch GET /api/tds:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        if (manual) setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Requirement 5: Fetch GET /api/tds automatically every 5 seconds
  useEffect(() => {
    isMountedRef.current = true;
    fetchTdsReading();

    const pollInterval = setInterval(() => {
      fetchTdsReading();
    }, 5000);

    // Also listen to Socket.io for instant hardware push updates
    const socket = getSocket();
    const handleDirectReading = (pushedData: DirectTDSReading) => {
      if (!isMountedRef.current) return;
      if (pushedData) {
        setReading(pushedData);
        setLastFetchTime(new Date());
      }
    };

    if (socket) {
      socket.on('tds_direct_reading', handleDirectReading);
    }

    return () => {
      isMountedRef.current = false;
      clearInterval(pollInterval);
      if (socket) {
        socket.off('tds_direct_reading', handleDirectReading);
      }
    };
  }, [fetchTdsReading]);

  // Keep live relative timestamp updated
  useEffect(() => {
    const timer = setInterval(() => {
      if (reading?.updatedAt) {
        const updateDate = new Date(reading.updatedAt);
        const diff = Math.max(0, Math.floor((Date.now() - updateDate.getTime()) / 1000));
        setSecondsAgo(diff);
      } else {
        setSecondsAgo(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reading?.updatedAt]);

  const hasData = reading !== null && reading.tds_ppm !== null && typeof reading.tds_ppm === 'number';

  // Determine dynamic badge colors based on TDS / status
  const getStatusTheme = () => {
    if (!hasData) {
      return {
        cardBg: 'bg-slate-900/40 border-slate-800',
        textColor: 'text-slate-400',
        badge: 'bg-slate-800 text-slate-300 border-slate-700',
        label: 'Waiting for sensor data'
      };
    }
    const val = reading.tds_ppm!;
    if (val < 50) {
      return {
        cardBg: 'bg-cyan-950/20 border-cyan-800/40',
        textColor: 'text-cyan-400',
        badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        label: reading.status || 'Very Low TDS'
      };
    }
    if (val <= 300) {
      return {
        cardBg: 'bg-emerald-950/20 border-emerald-800/40',
        textColor: 'text-emerald-400',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        label: reading.status || 'Ideal Drinking TDS'
      };
    }
    if (val <= 500) {
      return {
        cardBg: 'bg-amber-950/20 border-amber-800/40',
        textColor: 'text-amber-400',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        label: reading.status || 'Moderate / Elevated TDS'
      };
    }
    return {
      cardBg: 'bg-rose-950/20 border-rose-800/40',
      textColor: 'text-rose-400',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      label: reading.status || 'High TDS'
    };
  };

  const theme = getStatusTheme();

  // Format ISO timestamp
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return 'Waiting for sensor data';
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime()) ? isoString : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const curlExample = `curl -X POST http://localhost:5000/api/tds \\
  -H "Content-Type: application/json" \\
  -d '{"tds_ppm": 32, "raw_adc": 23.4, "status": "Normal TDS Range", "device_key": "tds-demo-2026"}'`;

  // Submit test POST
  const handleSendTestPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestPosting(true);
    setTestFeedback(null);
    try {
      const res = await api.postDirectTDS({
        tds_ppm: parseFloat(testTds),
        raw_adc: parseFloat(testRawAdc),
        status: testStatus,
        device_key: testDeviceKey
      });
      if (res.success) {
        setTestFeedback('Telemetry posted successfully! Dashboard updated.');
        await fetchTdsReading();
      } else {
        setTestFeedback(`Error: ${typeof res.error === 'string' ? res.error : res.error?.message || 'POST failed'}`);
      }
    } catch (err: any) {
      setTestFeedback(`Network error: ${err.message}`);
    } finally {
      setTestPosting(false);
      setTimeout(() => setTestFeedback(null), 5000);
    }
  };

  const copyToClipboard = (text: string, type: 'curl' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  if (loading && !reading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 glass-panel border border-slate-800">
        <Activity className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-sm font-medium text-slate-300">Connecting to /api/tds telemetry stream...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Live TDS Monitor
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Auto-fetch 5s {lastFetchTime ? `(${lastFetchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})` : ''}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time NodeMCU ESP8266 Drinking-Water TDS Telemetry Stream (<code className="text-cyan-400">/api/tds</code>)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => fetchTdsReading(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-dark-800 hover:bg-dark-750 border border-slate-700/60 rounded-xl transition-all shadow-sm"
            title="Fetch latest GET /api/tds now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh Now
          </button>

          <button
            onClick={() => copyToClipboard('http://localhost:5000/api/tds', 'url')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-all"
            title="Copy API Endpoint"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedUrl ? 'Copied URL!' : 'POST /api/tds'}
          </button>
        </div>
      </div>

      {/* Mandatory Safety Requirement Note */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-amber-300">
            Important Drinking-Water Safety Note:
          </p>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300 font-semibold">TDS measures dissolved solids only; it does not prove water is safe to drink.</strong>{' '}
            TDS only measures dissolved minerals and salts. It does not detect pathogens, pesticides, heavy metals, or hazardous microorganisms. Full potable water suitability requires certified laboratory testing.
          </p>
        </div>
      </div>

      {/* Main Real-Time Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Large Card: Current TDS (ppm) */}
        <div className={`md:col-span-2 glass-panel p-6 border ${theme.cardBg} transition-all duration-300 relative overflow-hidden flex flex-col justify-between`}>
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-dark-900/60 border border-slate-700/50 text-cyan-400">
                  <Radio className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Real Sensor TDS Reading
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasData ? (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${theme.badge} flex items-center gap-1.5`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {theme.label}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Waiting for sensor data
                  </span>
                )}
              </div>
            </div>

            {/* Huge Number Display */}
            <div className="my-6">
              {hasData ? (
                <div className="flex items-baseline gap-3">
                  <span className={`text-6xl md:text-7xl font-extrabold tracking-tight ${theme.textColor} font-sans`}>
                    {reading?.tds_ppm}
                  </span>
                  <span className="text-2xl font-bold text-slate-400 font-mono">ppm</span>
                </div>
              ) : (
                <div className="py-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl md:text-6xl font-extrabold text-slate-600 font-mono">--</span>
                    <span className="text-xl font-medium text-slate-500 font-mono">ppm</span>
                  </div>
                  <p className="text-sm text-amber-400/90 font-medium mt-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Waiting for sensor data
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    No ESP8266 reading has arrived yet. Ingesting via <code className="text-cyan-400">POST /api/tds</code>.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Card Meta Details */}
          <div className="pt-4 mt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Last Updated:</span>
              <span className="text-slate-200 font-mono">
                {hasData ? formatTime(reading?.updatedAt) : 'Waiting for sensor data'}
              </span>
              {secondsAgo !== null && (
                <span className="text-slate-500">({secondsAgo}s ago)</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Poll Interval: <strong className="text-slate-300">5 seconds</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Raw ADC Cards */}
        <div className="space-y-5 flex flex-col justify-between">
          {/* Status Card */}
          <div className="glass-panel p-5 border border-slate-800 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Reading Status
              </span>
              <span className="text-[10px] text-slate-500 font-mono">ESP8266 Classification</span>
            </div>

            <div className="py-2">
              <div className="text-xl font-bold text-white">
                {hasData && reading?.status ? (
                  <span className={`inline-block px-3 py-1 rounded-lg border ${theme.badge}`}>
                    {reading.status}
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal italic">
                    Waiting for sensor data
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              {hasData
                ? `Received directly from ESP8266 payload string field "status".`
                : `Awaiting first HTTP POST transmission from NodeMCU.`}
            </p>
          </div>

          {/* Raw ADC Card */}
          <div className="glass-panel p-5 border border-slate-800 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Raw ADC Value
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Analog Pin A0</span>
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-100 font-mono">
                  {hasData && reading?.raw_adc !== null ? reading.raw_adc : '--'}
                </span>
                <span className="text-xs text-slate-400 font-mono">ADC units</span>
              </div>
              {hasData && reading?.raw_adc !== null && (
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Voltage ~{((Number(reading.raw_adc) * 3.3) / 1024).toFixed(3)}V (3.3V Ref)
                </p>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              {hasData
                ? `Raw ADC input before sensor polynomial transformation.`
                : `Waiting for sensor data from NodeMCU A0 pin.`}
            </p>
          </div>
        </div>
      </div>

      {/* Integration & Testing Card */}
      <div className="glass-panel p-6 border border-slate-800/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              NodeMCU ESP8266 API Endpoint Specifications
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Send JSON POST requests directly from your ESP8266 or microcontrollers.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-dark-900 border border-slate-700 text-slate-300">
            HTTP 200 / HTTP 400 Validation Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* Left: Curl & Arduino Snippet */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                1. Test via curl (Command Line)
              </span>
              <button
                onClick={() => copyToClipboard(curlExample, 'curl')}
                className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCurl ? 'Copied!' : 'Copy curl'}
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-dark-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
              {curlExample}
            </pre>

            <div className="p-3 rounded-xl bg-dark-900/50 border border-slate-800 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">NodeMCU ESP8266 Firmware Target:</p>
              <p className="font-mono text-cyan-300 text-[11px]">
                Local URL: http://&lt;YOUR_COMPUTER_IP&gt;:5000/api/tds
              </p>
              <p className="font-mono text-slate-400 text-[11px]">
                Production URL: https://&lt;YOUR_DOMAIN&gt;/api/tds
              </p>
            </div>
          </div>

          {/* Right: Interactive Real POST Tester */}
          <div className="p-4 rounded-xl bg-dark-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                2. Test Real POST /api/tds from Browser
              </span>
              <span className="text-[10px] text-slate-400">Triggers real API data ingestion</span>
            </div>

            <form onSubmit={handleSendTestPost} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-mono">tds_ppm (number)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={testTds}
                    onChange={(e) => setTestTds(e.target.value)}
                    className="w-full glass-input text-xs py-1.5 px-3"
                    placeholder="e.g. 32"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-mono">raw_adc (number)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={testRawAdc}
                    onChange={(e) => setTestRawAdc(e.target.value)}
                    className="w-full glass-input text-xs py-1.5 px-3"
                    placeholder="e.g. 23.4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">status (string)</label>
                <input
                  type="text"
                  required
                  value={testStatus}
                  onChange={(e) => setTestStatus(e.target.value)}
                  className="w-full glass-input text-xs py-1.5 px-3"
                  placeholder="e.g. Normal TDS Range"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">device_key (auth key)</label>
                <input
                  type="text"
                  required
                  value={testDeviceKey}
                  onChange={(e) => setTestDeviceKey(e.target.value)}
                  className="w-full glass-input text-xs py-1.5 px-3 font-mono text-cyan-300"
                  placeholder="tds-demo-2026"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  disabled={testPosting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-dark-900 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-glow-cyan"
                >
                  <Send className={`w-3.5 h-3.5 ${testPosting ? 'animate-spin' : ''}`} />
                  {testPosting ? 'Sending...' : 'Send Test POST to /api/tds'}
                </button>

                {testFeedback && (
                  <span className="text-xs font-medium text-emerald-400 animate-fadeIn">
                    {testFeedback}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTDSMonitorPage;
