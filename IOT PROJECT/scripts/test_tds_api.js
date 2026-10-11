#!/usr/bin/env node

/**
 * Automated Verification Script for /api/tds endpoints:
 * 1. Test GET /api/tds (returns message when empty or reading object)
 * 2. Test POST /api/tds without valid device_key (verify HTTP 401)
 * 3. Test POST /api/tds with invalid data types (verify HTTP 400)
 * 4. Test POST /api/tds with valid data and device_key "tds-demo-2026" (verify HTTP 200 + { "success": true, "message": "TDS reading received" })
 * 5. Test GET /api/tds (verify real sensor reading returned)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api/tds';

console.log('\x1b[36m%s\x1b[0m', '=============================================================');
console.log('\x1b[36m%s\x1b[0m', '   🧪 Real-time TDS API Verification Suite (/api/tds)       ');
console.log('\x1b[36m%s\x1b[0m', '=============================================================');
console.log(` Target Endpoint: \x1b[33m${BASE_URL}\x1b[0m\n`);

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function testCase(name, fn) {
    try {
      await fn();
      console.log(` \x1b[32m✔ PASS\x1b[0m ${name}`);
      passed++;
    } catch (err) {
      console.error(` \x1b[31m✘ FAIL\x1b[0m ${name}: ${err.message}`);
      failed++;
    }
  }

  // Test 1: POST /api/tds rejects requests without valid device_key (HTTP 401)
  await testCase('1. POST /api/tds rejects missing device_key (HTTP 401)', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tds_ppm: 32, raw_adc: 23.4, status: 'Normal TDS Range' })
    });
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    const data = await res.json();
    if (data.success !== false) throw new Error(`Expected success: false`);
  });

  await testCase('2. POST /api/tds rejects wrong device_key (HTTP 401)', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tds_ppm: 32,
        raw_adc: 23.4,
        status: 'Normal TDS Range',
        device_key: 'wrong-key-123'
      })
    });
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
  });

  // Test 3: POST /api/tds validation checks with valid device_key (HTTP 400)
  await testCase('3. POST /api/tds rejects non-numeric tds_ppm (HTTP 400)', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tds_ppm: 'invalid_number',
        raw_adc: 23.4,
        status: 'Normal TDS Range',
        device_key: 'tds-demo-2026'
      })
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
  });

  await testCase('4. POST /api/tds rejects non-numeric raw_adc (HTTP 400)', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tds_ppm: 32,
        raw_adc: 'invalid_adc',
        status: 'Normal TDS Range',
        device_key: 'tds-demo-2026'
      })
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
  });

  await testCase('5. POST /api/tds rejects non-string status (HTTP 400)', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tds_ppm: 32,
        raw_adc: 23.4,
        status: '',
        device_key: 'tds-demo-2026'
      })
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
  });

  // Test 6: POST /api/tds with VALID payload & device_key "tds-demo-2026"
  await testCase('6. POST /api/tds accepts valid data and returns { "success": true, "message": "TDS reading received" } (HTTP 200)', async () => {
    const payload = {
      tds_ppm: 32,
      raw_adc: 23.4,
      status: 'Normal TDS Range',
      device_key: 'tds-demo-2026'
    };
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(`Expected data.success to be true`);
    if (data.message !== 'TDS reading received') {
      throw new Error(`Expected message "TDS reading received", got "${data.message}"`);
    }
    console.log(`    Ingested successfully:`, data);
  });

  // Test 7: GET /api/tds returns the stored sensor reading
  await testCase('7. GET /api/tds returns the latest received sensor reading', async () => {
    const res = await fetch(BASE_URL);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (data.tds_ppm !== 32) throw new Error(`Expected tds_ppm 32, got ${data.tds_ppm}`);
    if (data.raw_adc !== 23.4) throw new Error(`Expected raw_adc 23.4, got ${data.raw_adc}`);
    if (data.status !== 'Normal TDS Range') throw new Error(`Expected status 'Normal TDS Range', got ${data.status}`);
    if (!data.updatedAt) throw new Error(`Missing updatedAt timestamp`);
    console.log(`    Latest real reading:`, data);
  });

  console.log('\n-------------------------------------------------------------');
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log('-------------------------------------------------------------\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
