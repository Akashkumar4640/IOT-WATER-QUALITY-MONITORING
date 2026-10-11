/**
 * Format numbers with safe precision and units
 */
export function formatSensorValue(value: number | null | undefined, precision: number = 2, fallback: string = '--'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return value.toFixed(precision);
}

/**
 * Format timestamp safely for UI display
 */
export function formatTimestamp(timestampStr?: string | null): string {
  if (!timestampStr) return '--:--:--';
  const str = String(timestampStr).trim();
  const dateObj = new Date(str.endsWith('Z') || str.includes('T') ? str : str.replace(' ', 'T') + 'Z');
  if (isNaN(dateObj.getTime())) return '--:--:--';
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Format full date & time for reports
 */
export function formatFullDateTime(timestampStr?: string | null): string {
  if (!timestampStr) return '--';
  const str = String(timestampStr).trim();
  const dateObj = new Date(str.endsWith('Z') || str.includes('T') ? str : str.replace(' ', 'T') + 'Z');
  if (isNaN(dateObj.getTime())) return '--';
  return dateObj.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
