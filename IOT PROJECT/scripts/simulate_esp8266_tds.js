#!/usr/bin/env node

/**
 * ESP8266 NodeMCU TDS Sensor Telemetry Simulator
 * Simulates real-time hardware telemetry and demonstrates salt addition
 * changing water drinkability status in real time.
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000/api/tds/telemetry';
const DEVICE_ID = 'NODEMCU-TDS-01';

console.log('\x1b[36m%s\x1b[0m', '=============================================================');
console.log('\x1b[36m%s\x1b[0m', '  🌊 ESP8266 NodeMCU TDS Sensor Telemetry Simulator          ');
console.log('\x1b[36m%s\x1b[0m', '=============================================================');
console.log(` Target Server: \x1b[33m${SERVER_URL}\x1b[0m`);
console.log(` Device ID:     \x1b[32m${DEVICE_ID}\x1b[0m\n`);

// Simulation stages demonstrating salt addition
const demoStages = [
  { name: 'Pure Filtered RO Water', baseTds: 65, notes: 'Demineralized stream' },
  { name: 'Municipal Tap Water (Ideal)', baseTds: 175, notes: 'Balanced minerals, standard drinking tap' },
  { name: 'Natural Mineral Spring Water', baseTds: 285, notes: 'Natural calcium & magnesium minerality' },
  { name: 'Pinch of Table Salt Added (NaCl)', baseTds: 385, notes: 'Higher ionic conductivity detected' },
  { name: 'Moderate Table Salt Added', baseTds: 460, notes: 'Approaching upper drinking threshold' },
  { name: 'Spoon of Salt Added (Saline)', baseTds: 680, notes: 'Excessive dissolved sodium chloride' },
  { name: 'High Salinity / Brackish Runoff', baseTds: 890, notes: 'Very high salts and dissolved minerals' },
];

let stageIndex = 1; // Start at Municipal Tap Water (Drinkable)
let packetCount = 0;
let cycleTicks = 0;

async function transmitPacket() {
  const currentStage = demoStages[stageIndex];
  
  // Add small realistic sensor jitter (+/- 2.5 ppm)
  const jitter = (Math.random() - 0.5) * 5;
  const tds = +(currentStage.baseTds + jitter).toFixed(1);
  const voltage = +(tds / 450).toFixed(3);
  const rawAdc = Math.round(voltage * 1024 / 3.3);
  const temperature = +(24.8 + (Math.random() - 0.5) * 0.4).toFixed(1);

  const payload = {
    deviceId: DEVICE_ID,
    tds,
    voltage,
    temperature,
    rawAdc,
    notes: `[Sim] ${currentStage.name}`,
    isSimulated: true
  };

  try {
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    packetCount++;

    if (data.success && data.data) {
      const d = data.data;
      const colorCode = d.statusCode === 'DRINKABLE' ? '\x1b[32m' : (d.statusCode === 'CAUTION' ? '\x1b[33m' : '\x1b[31m');
      
      console.log(
        `[#${packetCount}] TDS: \x1b[1m${d.tds} ppm\x1b[0m | Voltage: ${d.voltage}V | ` +
        `Status: ${colorCode}${d.statusLabel}\x1b[0m | ` +
        `Stage: \x1b[36m${currentStage.name}\x1b[0m`
      );
    }
  } catch (err) {
    console.error(`\x1b[31m[ERR] Failed to transmit telemetry:\x1b[0m ${err.message}`);
  }

  // Advance simulation stage every 5 packets (~15 seconds) to demonstrate transitions
  cycleTicks++;
  if (cycleTicks >= 5) {
    cycleTicks = 0;
    stageIndex = (stageIndex + 1) % demoStages.length;
    console.log(`\n\x1b[35m>>> Transitioning to: ${demoStages[stageIndex].name} (~${demoStages[stageIndex].baseTds} ppm) <<<\x1b[0m\n`);
  }
}

// Transmit every 3 seconds (mimics ESP8266 loop interval)
transmitPacket();
setInterval(transmitPacket, 3000);
