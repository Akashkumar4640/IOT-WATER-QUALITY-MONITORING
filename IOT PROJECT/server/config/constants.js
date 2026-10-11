module.exports = {
  DEFAULT_THRESHOLDS: {
    ph: { min: 6.5, max: 8.5, criticalMin: 5.5, criticalMax: 9.5, unit: 'pH' },
    temperature: { min: 10.0, max: 35.0, criticalMin: 5.0, criticalMax: 45.0, unit: '°C' },
    tds: { warning: 300, max: 500, criticalMax: 1000, unit: 'ppm' },
    turbidity: { warning: 5.0, max: 10.0, criticalMax: 25.0, unit: 'NTU' },
    ec: { warning: 500, max: 800, criticalMax: 1500, unit: 'µS/cm' },
    waterLevel: { min: 20, max: 95, unit: '%' },
    offlineTimeoutSeconds: 15
  },
  DEFAULT_CALIBRATIONS: {
    ph: { slope: -5.70, intercept: 21.34, neutralVoltage: 2.50, acidVoltage: 3.00 },
    tds: { kFactor: 0.50 },
    turbidity: { clearVoltage: 4.10 },
    ec: { cellConstant: 1.0 },
    waterLevel: { minRaw: 300, maxRaw: 3500 }
  },
  WQI_STATUS: {
    EXCELLENT: { label: 'Excellent Quality', color: 'green', minScore: 85 },
    GOOD: { label: 'Good Quality', color: 'cyan', minScore: 70 },
    FAIR: { label: 'Fair Quality', color: 'orange', minScore: 50 },
    POOR: { label: 'Poor Quality', color: 'red', minScore: 25 },
    CRITICAL: { label: 'Critical Pollution', color: 'red', minScore: 0 }
  }
};
