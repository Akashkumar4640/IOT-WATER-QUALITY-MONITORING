/**
 * Sensor mathematics and signal filter calculations
 */
class MathUtils {
  static round(val, decimals = 2) {
    if (val === null || val === undefined || isNaN(val)) return null;
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
  }

  static clamp(val, min, max) {
    if (val === null || val === undefined) return null;
    return Math.min(Math.max(val, min), max);
  }

  static calculateAverage(numbers) {
    const valid = numbers.filter(n => n !== null && n !== undefined && !isNaN(n));
    if (valid.length === 0) return null;
    const sum = valid.reduce((acc, curr) => acc + curr, 0);
    return sum / valid.length;
  }
}

module.exports = MathUtils;
