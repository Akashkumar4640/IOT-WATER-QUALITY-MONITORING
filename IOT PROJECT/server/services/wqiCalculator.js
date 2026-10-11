/**
 * Water Quality Index (WQI) calculation module.
 * Evaluates available sensor readings (pH, TDS, Turbidity, Temperature, EC).
 * Computes a weighted index only from active, connected sensors.
 */

function calculateWQI(reading, thresholds = null) {
  if (!reading) return { score: null, status: 'UNAVAILABLE', label: 'No Sensor Data', message: 'No measurements available' };

  const defaultThresholds = {
    ph: { ideal: 7.0, min: 6.5, max: 8.5, weight: 0.35 },
    tds: { ideal: 150, max: 500, weight: 0.25 },
    turbidity: { ideal: 1.0, max: 5.0, weight: 0.25 },
    temperature: { ideal: 25.0, min: 15.0, max: 30.0, weight: 0.15 }
  };

  let totalWeight = 0;
  let weightedSubIndexSum = 0;
  let activeSensorCount = 0;
  let criticalFlags = 0;
  let warningFlags = 0;

  // 1. pH sub-index (0 - 100)
  if (reading.ph !== null && reading.ph !== undefined) {
    activeSensorCount++;
    const weight = defaultThresholds.ph.weight;
    totalWeight += weight;

    let subIndex = 100;
    const deviation = Math.abs(reading.ph - 7.0);
    if (deviation <= 0.5) { // 6.5 - 7.5
      subIndex = 100 - (deviation * 10);
    } else if (deviation <= 1.5) { // 5.5 - 8.5
      subIndex = 95 - (deviation - 0.5) * 25;
      warningFlags++;
    } else { // Extreme pH
      subIndex = Math.max(10, 70 - (deviation - 1.5) * 25);
      criticalFlags++;
    }
    weightedSubIndexSum += subIndex * weight;
  }

  // 2. TDS sub-index (0 - 100)
  if (reading.tds !== null && reading.tds !== undefined) {
    activeSensorCount++;
    const weight = defaultThresholds.tds.weight;
    totalWeight += weight;

    let subIndex = 100;
    if (reading.tds <= 300) {
      subIndex = 100 - (reading.tds / 300) * 10;
    } else if (reading.tds <= 500) {
      subIndex = 90 - ((reading.tds - 300) / 200) * 20;
      warningFlags++;
    } else if (reading.tds <= 1000) {
      subIndex = 70 - ((reading.tds - 500) / 500) * 35;
      warningFlags++;
    } else {
      subIndex = Math.max(10, 35 - ((reading.tds - 1000) / 1000) * 25);
      criticalFlags++;
    }
    weightedSubIndexSum += subIndex * weight;
  }

  // 3. Turbidity sub-index (0 - 100)
  if (reading.turbidity !== null && reading.turbidity !== undefined) {
    activeSensorCount++;
    const weight = defaultThresholds.turbidity.weight;
    totalWeight += weight;

    let subIndex = 100;
    if (reading.turbidity <= 1.0) {
      subIndex = 100 - (reading.turbidity * 5);
    } else if (reading.turbidity <= 5.0) {
      subIndex = 95 - ((reading.turbidity - 1.0) / 4.0) * 25;
    } else if (reading.turbidity <= 10.0) {
      subIndex = 70 - ((reading.turbidity - 5.0) / 5.0) * 30;
      warningFlags++;
    } else {
      subIndex = Math.max(10, 40 - ((reading.turbidity - 10.0) / 15.0) * 30);
      criticalFlags++;
    }
    weightedSubIndexSum += subIndex * weight;
  }

  // 4. Temperature sub-index (0 - 100)
  if (reading.temperature !== null && reading.temperature !== undefined) {
    activeSensorCount++;
    const weight = defaultThresholds.temperature.weight;
    totalWeight += weight;

    let subIndex = 100;
    if (reading.temperature >= 18 && reading.temperature <= 28) {
      subIndex = 100;
    } else if (reading.temperature >= 10 && reading.temperature <= 35) {
      subIndex = 85;
    } else {
      subIndex = 60;
      warningFlags++;
    }
    weightedSubIndexSum += subIndex * weight;
  }

  if (activeSensorCount === 0 || totalWeight === 0) {
    return {
      score: null,
      status: 'UNAVAILABLE',
      color: 'gray',
      label: 'Insufficient Data',
      message: 'Insufficient data to calculate water quality score. Awaiting connected sensor telemetry.',
      activeSensors: 0
    };
  }

  const rawScore = Math.round(weightedSubIndexSum / totalWeight);
  const score = Math.min(100, Math.max(0, rawScore));

  let status = 'GOOD';
  let color = 'green';
  let label = 'GOOD';
  let message = `Score calculated from ${activeSensorCount} available parameter${activeSensorCount > 1 ? 's' : ''}. All active parameters within configured limits.`;

  if (criticalFlags > 0 || score < 50) {
    status = 'CRITICAL';
    color = 'red';
    label = 'CRITICAL';
    message = `Critical anomalies detected across ${criticalFlags} monitored parameter${criticalFlags > 1 ? 's' : ''}.`;
  } else if (warningFlags > 0 || score < 80) {
    status = 'WARNING';
    color = 'orange';
    label = 'WARNING';
    message = `Variance observed in ${warningFlags} parameter${warningFlags > 1 ? 's' : ''} (evaluated from ${activeSensorCount} active sensors).`;
  }

  return {
    score,
    status,
    color,
    label,
    message,
    activeSensors: activeSensorCount,
    disclaimer: 'This system is a real-time monitoring and analysis tool, not a laboratory certification system.'
  };
}

module.exports = { calculateWQI };
