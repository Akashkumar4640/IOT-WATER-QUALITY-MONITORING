/**
 * TDS Drinkability & Chemical Content Evaluator
 * Based on WHO / BIS 10500 standards and the specific project decision logic:
 * 
 * - If TDS <= 300 ppm:
 *   Status: "Drinkable (indicative)"
 *   Likely components: "Moderate minerals – likely calcium, magnesium, bicarbonates."
 * 
 * - If 300 < TDS <= 500 ppm:
 *   Status: "High TDS – use with caution (indicative)"
 *   Likely components: "High minerals/salts – likely calcium, magnesium; possibly sodium, chloride, sulfate."
 * 
 * - If TDS > 500 ppm:
 *   Status: "Not recommended for drinking (indicative)"
 *   Likely components: "Very high salts/minerals – likely high sodium, chloride, sulfate, nitrates, along with calcium and magnesium."
 */

function evaluateTDS(tdsVal) {
  const tds = Number(tdsVal);
  if (isNaN(tds) || tds < 0) {
    return {
      tds: 0,
      statusCode: 'INVALID',
      statusLabel: 'Invalid Reading',
      color: 'slate',
      drinkable: false,
      likelyComponents: 'No sensor reading detected',
      advisory: 'Please check your TDS sensor probe immersion and analog wiring.',
      breakdown: []
    };
  }

  const roundedTds = Math.round(tds * 10) / 10;
  let statusCode = 'DRINKABLE';
  let statusLabel = 'Drinkable (indicative)';
  let likelyComponents = 'Moderate minerals – likely calcium, magnesium, bicarbonates.';
  let color = 'emerald';
  let drinkable = true;
  let grade = 'Excellent (Palatable & Safe)';
  let advisory = 'Water is within optimal drinking range (≤ 300 ppm). Ideal mineral balance for daily hydration.';

  if (roundedTds <= 300) {
    statusCode = 'DRINKABLE';
    statusLabel = 'Drinkable (indicative)';
    likelyComponents = 'Moderate minerals – likely calcium, magnesium, bicarbonates.';
    color = 'emerald';
    drinkable = true;
    grade = roundedTds < 150 ? 'Very Pure / Low Mineral' : 'Optimal Mineral Balance';
    advisory = 'Water is suitable for daily drinking under indicative TDS guidelines (≤ 300 ppm).';
  } else if (roundedTds <= 500) {
    statusCode = 'CAUTION';
    statusLabel = 'High TDS – use with caution (indicative)';
    likelyComponents = 'High minerals/salts – likely calcium, magnesium; possibly sodium, chloride, sulfate.';
    color = 'amber';
    drinkable = true;
    grade = 'High Mineral Concentration';
    advisory = 'Acceptable upper threshold for drinking. Higher dissolved salt concentration; sensitive individuals may notice mineral taste.';
  } else {
    statusCode = 'UNSAFE';
    statusLabel = 'Not recommended for drinking (indicative)';
    likelyComponents = 'Very high salts/minerals – likely high sodium, chloride, sulfate, nitrates, along with calcium and magnesium.';
    color = 'rose';
    drinkable = false;
    grade = 'Excessive Dissolved Solids (Unsuitable)';
    advisory = 'Exceeds recommended drinking water limit (> 500 ppm). May have salty/brackish taste or indicate high dissolved mineral salts. Further filtration or RO treatment recommended.';
  }

  // Simulated chemical ionic breakdown proportional to typical tap/groundwater
  let breakdown = [];
  if (roundedTds <= 300) {
    breakdown = [
      { name: 'Calcium (Ca²⁺)', percentage: 35, estPpm: Math.round(roundedTds * 0.35), formula: 'Ca²⁺', role: 'Bone health, mild natural hardness' },
      { name: 'Magnesium (Mg²⁺)', percentage: 25, estPpm: Math.round(roundedTds * 0.25), formula: 'Mg²⁺', role: 'Metabolic balance, crisp taste' },
      { name: 'Bicarbonates (HCO₃⁻)', percentage: 30, estPpm: Math.round(roundedTds * 0.30), formula: 'HCO₃⁻', role: 'Natural alkaline buffer' },
      { name: 'Trace Salts (Na⁺, Cl⁻)', percentage: 10, estPpm: Math.round(roundedTds * 0.10), formula: 'NaCl', role: 'Background electrolytes' }
    ];
  } else if (roundedTds <= 500) {
    breakdown = [
      { name: 'Calcium & Magnesium', percentage: 35, estPpm: Math.round(roundedTds * 0.35), formula: 'Ca²⁺ / Mg²⁺', role: 'Significant scaling hardness' },
      { name: 'Sodium (Na⁺)', percentage: 25, estPpm: Math.round(roundedTds * 0.25), formula: 'Na⁺', role: 'Dissolved minerals & table salts' },
      { name: 'Chloride (Cl⁻)', percentage: 25, estPpm: Math.round(roundedTds * 0.25), formula: 'Cl⁻', role: 'Noticeable saline minerality' },
      { name: 'Sulfates (SO₄²⁻)', percentage: 15, estPpm: Math.round(roundedTds * 0.15), formula: 'SO₄²⁻', role: 'Mineral astringency' }
    ];
  } else {
    breakdown = [
      { name: 'Sodium & Chloride (NaCl)', percentage: 40, estPpm: Math.round(roundedTds * 0.40), formula: 'Na⁺ + Cl⁻', role: 'High salinity / dissolved table salt' },
      { name: 'Sulfates (SO₄²⁻)', percentage: 25, estPpm: Math.round(roundedTds * 0.25), formula: 'SO₄²⁻', role: 'Laxative potential at elevated levels' },
      { name: 'Nitrates (NO₃⁻)', percentage: 10, estPpm: Math.round(roundedTds * 0.10), formula: 'NO₃⁻', role: 'Agricultural runoff / organic oxidation' },
      { name: 'Hardness Minerals (Ca, Mg)', percentage: 25, estPpm: Math.round(roundedTds * 0.25), formula: 'Ca²⁺ + Mg²⁺', role: 'Severe pipe encrustation & mineral scale' }
    ];
  }

  return {
    tds: roundedTds,
    statusCode,
    statusLabel,
    color,
    grade,
    drinkable,
    likelyComponents,
    advisory,
    breakdown
  };
}

module.exports = { evaluateTDS };
