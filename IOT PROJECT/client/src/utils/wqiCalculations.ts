import type { SensorReading, WaterQualityAnalysis } from '../types';

/**
 * Calculates real-time Water Quality Index from sensor telemetry
 */
export function calculateClientWQI(reading: Partial<SensorReading> | null): WaterQualityAnalysis {
  if (!reading) {
    return {
      score: null,
      status: 'UNAVAILABLE',
      color: 'gray',
      label: 'Sensor Offline',
      message: 'No live telemetry received from analyzer.',
      activeSensors: 0
    };
  }

  let totalWeight = 0;
  let scoreAccumulator = 0;
  let activeSensors = 0;

  if (reading.ph !== null && reading.ph !== undefined) {
    activeSensors++;
    const phDiff = Math.abs(reading.ph - 7.0);
    const qPh = Math.max(0, 100 - (phDiff / 2.5) * 100);
    scoreAccumulator += qPh * 0.30;
    totalWeight += 0.30;
  }

  if (reading.tds !== null && reading.tds !== undefined) {
    activeSensors++;
    const qTds = Math.max(0, 100 - (reading.tds / 1000) * 100);
    scoreAccumulator += qTds * 0.25;
    totalWeight += 0.25;
  }

  if (reading.turbidity !== null && reading.turbidity !== undefined) {
    activeSensors++;
    const qTurb = Math.max(0, 100 - (reading.turbidity / 10.0) * 100);
    scoreAccumulator += qTurb * 0.25;
    totalWeight += 0.25;
  }

  if (reading.temperature !== null && reading.temperature !== undefined) {
    activeSensors++;
    const tempDiff = Math.abs(reading.temperature - 22.0);
    const qTemp = Math.max(0, 100 - (tempDiff / 15.0) * 100);
    scoreAccumulator += qTemp * 0.10;
    totalWeight += 0.10;
  }

  if (reading.ec !== null && reading.ec !== undefined) {
    activeSensors++;
    const qEc = Math.max(0, 100 - (reading.ec / 1200) * 100);
    scoreAccumulator += qEc * 0.10;
    totalWeight += 0.10;
  }

  if (totalWeight === 0 || activeSensors < 1) {
    return {
      score: null,
      status: 'UNAVAILABLE',
      color: 'gray',
      label: 'Insufficient Data',
      message: 'Awaiting sensor telemetry packets...',
      activeSensors
    };
  }

  const finalScore = Math.round((scoreAccumulator / totalWeight) * 10) / 10;

  if (finalScore >= 85) {
    return {
      score: finalScore,
      grade: 'A',
      status: 'EXCELLENT',
      color: 'green',
      label: 'Excellent Quality',
      message: 'All chemical and physical parameters within pristine potable standards.',
      potable: true,
      activeSensors
    };
  }

  if (finalScore >= 70) {
    return {
      score: finalScore,
      grade: 'B',
      status: 'GOOD',
      color: 'green',
      label: 'Good Quality',
      message: 'Water quality is safe for general potable and domestic utilization.',
      potable: true,
      activeSensors
    };
  }

  if (finalScore >= 50) {
    return {
      score: finalScore,
      grade: 'C',
      status: 'WARNING',
      color: 'orange',
      label: 'Fair / Moderate',
      message: 'Parameters are elevated. Filtration or treatment recommended.',
      potable: false,
      activeSensors
    };
  }

  return {
    score: finalScore,
    grade: 'F',
    status: 'CRITICAL',
    color: 'red',
    label: 'Critical Pollution',
    message: 'Water exceeds permissible hazard thresholds. Do NOT consume.',
    potable: false,
    activeSensors
  };
}
