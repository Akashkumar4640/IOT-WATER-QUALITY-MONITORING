#!/usr/bin/env node

/**
 * ESP32 Hardware Simulator CLI
 * Emulates physical ESP32 water quality device sending HTTP POST telemetry to the backend.
 * 
 * Usage:
 *   node simulate_esp32.js [--device WQ-ESP32-001] [--interval 5000] [--url http://localhost:5000/api/iot/readings]
 */

const http = require('http');

const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : def;
};

const DEVICE_ID = getArg('--device', 'WQ-ESP32-001');
const INTERVAL_MS = parseInt(getArg('--interval', '5000'), 10);
const SERVER_URL = getArg('--url', 'http://localhost:5000/api/iot/readings');
const DEVICE_TOKEN = 'wq-sec-token-esp32-001';

console.log('====================================================');
console.log('       ESP32 HARDWARE TELEMETRY SIMULATOR           ');
console.log('====================================================');
console.log(`Device ID:    ${DEVICE_ID}`);
console.log(`Endpoint:     ${SERVER_URL}`);
console.log(`Interval:     ${INTERVAL_MS}ms`);
console.log('Press Ctrl+C to stop simulation.');
console.log('====================================================\n');

// State variables for smooth Brownian-motion random walk
let state = {
  ph: 7.24,
  temperature: 26.5,
  tds: 312,
  turbidity: 2.1,
  ec: 445,
  waterLevel: 82
};

function randomDrift(val, min, max, maxDelta) {
  const delta = (Math.random() - 0.5) * 2 * maxDelta;
  let next = val + delta;
  if (next < min) next = min + Math.random() * maxDelta;
  if (next > max) next = max - Math.random() * maxDelta;
  return next;
}

function generateTelemetry() {
  state.ph = +(randomDrift(state.ph, 6.2, 8.8, 0.05).toFixed(2));
  state.temperature = +(randomDrift(state.temperature, 21.0, 31.0, 0.15).toFixed(1));
  state.tds = Math.round(randomDrift(state.tds, 180, 550, 4));
  state.turbidity = +(randomDrift(state.turbidity, 0.5, 8.5, 0.1).toFixed(2));
  state.ec = Math.round(state.tds * 1.42);
  state.waterLevel = +(randomDrift(state.waterLevel, 60, 95, 0.5).toFixed(1));

  // Compute realistic ADC raw simulation
  const phRaw = Math.round(state.ph * 258);
  const tdsRaw = Math.round(state.tds * 3.7);
  const turbRaw = Math.round(Math.max(100, 3100 - (state.turbidity * 280)));

  return {
    deviceId: DEVICE_ID,
    deviceToken: DEVICE_TOKEN,
    ph: state.ph,
    temperature: state.temperature,
    tds: state.tds,
    turbidity: state.turbidity,
    ec: state.ec,
    waterLevel: state.waterLevel,
    rawValues: {
      ph: { adc: phRaw, voltage: +(phRaw * (3.3 / 4095)).toFixed(3) },
      temperature: { raw: `${state.temperature}°C (DS18B20 1-Wire Hex 0x28)` },
      tds: { adc: tdsRaw, voltage: +(tdsRaw * (3.3 / 4095)).toFixed(3) },
      turbidity: { adc: turbRaw, voltage: +(turbRaw * (3.3 / 4095)).toFixed(3) },
      ec: { adc: Math.round(state.ec * 2.1), voltage: +((state.ec * 2.1) * (3.3 / 4095)).toFixed(3) },
      waterLevel: { adc: Math.round(state.waterLevel * 33), voltage: +((state.waterLevel * 33) * (3.3 / 4095)).toFixed(3) }
    },
    isSimulated: true
  };
}

function sendPacket() {
  const payload = generateTelemetry();
  const data = JSON.stringify(payload);

  const url = new URL(SERVER_URL);
  const options = {
    hostname: url.hostname,
    port: url.port || 5000,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'X-Device-Id': DEVICE_ID,
      'X-Device-Token': DEVICE_TOKEN
    }
  };

  const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', chunk => { responseBody += chunk; });
    res.on('end', () => {
      const timeStr = new Date().toLocaleTimeString();
      console.log(`[${timeStr}] TX -> HTTP ${res.statusCode} | pH: ${payload.ph} | Temp: ${payload.temperature}°C | TDS: ${payload.tds}ppm | Turbidity: ${payload.turbidity}NTU`);
    });
  });

  req.on('error', (err) => {
    console.error(`[TX FAILED] Could not reach server at ${SERVER_URL}: ${err.message}`);
  });

  req.write(data);
  req.end();
}

// Send initial packet and schedule intervals
sendPacket();
setInterval(sendPacket, INTERVAL_MS);
