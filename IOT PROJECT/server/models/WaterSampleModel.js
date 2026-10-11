const { dbQuery } = require('../config/db');

class WaterSampleModel {
  /**
   * Evaluates discrete water sample telemetry and analyzes WQI + status
   */
  static analyzeSample(sample) {
    const { ph, temperature, tds, turbidity, ec, waterLevel } = sample;
    
    // Check parameters against WHO / EPA drinking water standards
    const parameters = {
      ph: {
        value: ph,
        status: (ph >= 6.5 && ph <= 8.5) ? 'OPTIMAL' : (ph >= 6.0 && ph <= 9.0) ? 'ACCEPTABLE' : 'CRITICAL',
        standard: '6.5 - 8.5 pH',
        weight: 0.25
      },
      tds: {
        value: tds,
        status: tds <= 300 ? 'EXCELLENT' : tds <= 500 ? 'GOOD' : tds <= 1000 ? 'FAIR' : 'POOR',
        standard: '< 500 ppm',
        weight: 0.20
      },
      turbidity: {
        value: turbidity,
        status: turbidity <= 1.0 ? 'EXCELLENT' : turbidity <= 5.0 ? 'ACCEPTABLE' : 'CRITICAL',
        standard: '< 5.0 NTU',
        weight: 0.20
      },
      temperature: {
        value: temperature,
        status: (temperature >= 15.0 && temperature <= 28.0) ? 'OPTIMAL' : 'WARM',
        standard: '15 - 30 °C',
        weight: 0.10
      },
      ec: {
        value: ec,
        status: ec <= 500 ? 'GOOD' : ec <= 800 ? 'ACCEPTABLE' : 'HIGH',
        standard: '< 800 µS/cm',
        weight: 0.15
      },
      waterLevel: {
        value: waterLevel,
        status: waterLevel >= 20 ? 'SUFFICIENT' : 'LOW',
        standard: '> 20%',
        weight: 0.10
      }
    };

    let totalWeight = 0;
    let scoreAccumulator = 0;

    if (ph !== null && ph !== undefined) {
      const phDiff = Math.abs(ph - 7.0);
      const qPh = Math.max(0, 100 - (phDiff / 2.5) * 100);
      scoreAccumulator += qPh * 0.25;
      totalWeight += 0.25;
    }

    if (tds !== null && tds !== undefined) {
      const qTds = Math.max(0, 100 - (tds / 1000) * 100);
      scoreAccumulator += qTds * 0.20;
      totalWeight += 0.20;
    }

    if (turbidity !== null && turbidity !== undefined) {
      const qTurb = Math.max(0, 100 - (turbidity / 10.0) * 100);
      scoreAccumulator += qTurb * 0.20;
      totalWeight += 0.20;
    }

    if (ec !== null && ec !== undefined) {
      const qEc = Math.max(0, 100 - (ec / 1000) * 100);
      scoreAccumulator += qEc * 0.15;
      totalWeight += 0.15;
    }

    const finalScore = totalWeight > 0 ? Math.round((scoreAccumulator / totalWeight) * 10) / 10 : null;

    let status = 'UNAVAILABLE';
    let grade = 'N/A';
    let potable = false;

    if (finalScore !== null) {
      if (finalScore >= 85) {
        status = 'EXCELLENT';
        grade = 'A';
        potable = true;
      } else if (finalScore >= 70) {
        status = 'GOOD';
        grade = 'B';
        potable = true;
      } else if (finalScore >= 50) {
        status = 'FAIR';
        grade = 'C';
        potable = false;
      } else if (finalScore >= 25) {
        status = 'POOR';
        grade = 'D';
        potable = false;
      } else {
        status = 'CRITICAL';
        grade = 'F';
        potable = false;
      }
    }

    return {
      timestamp: sample.timestamp || new Date().toISOString(),
      score: finalScore,
      grade,
      status,
      potable,
      parameters
    };
  }
}

module.exports = WaterSampleModel;
