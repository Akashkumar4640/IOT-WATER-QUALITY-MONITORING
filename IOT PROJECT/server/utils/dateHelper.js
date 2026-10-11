/**
 * Date parsing and formatting utilities
 */
class DateHelper {
  static parseSafeUtcDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const str = String(dateStr).trim();
    if (str.endsWith('Z') || str.includes('T')) {
      return new Date(str);
    }
    // SQLite format "YYYY-MM-DD HH:MM:SS" -> convert to UTC ISO
    return new Date(str.replace(' ', 'T') + 'Z');
  }

  static getIsoString(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  static getSecondsDifference(earlierDate, laterDate = new Date()) {
    const d1 = this.parseSafeUtcDate(earlierDate);
    const d2 = this.parseSafeUtcDate(laterDate);
    if (!d1 || !d2) return null;
    return (d2.getTime() - d1.getTime()) / 1000;
  }
}

module.exports = DateHelper;
