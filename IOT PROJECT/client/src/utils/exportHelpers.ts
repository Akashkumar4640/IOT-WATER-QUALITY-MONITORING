import type { SensorReading } from '../types';

/**
 * Exports an array of sensor readings as CSV file download
 */
export function exportToCSV(data: SensorReading[], filename: string = 'water_quality_telemetry.csv'): void {
  if (!data || data.length === 0) {
    alert('No telemetry records available to export.');
    return;
  }

  const headers = ['Timestamp', 'pH', 'Temperature (°C)', 'TDS (ppm)', 'Turbidity (NTU)', 'EC (µS/cm)', 'Water Level (%)', 'Simulated'];
  const rows = data.map(r => [
    r.timestamp,
    r.ph ?? '',
    r.temperature ?? '',
    r.tds ?? '',
    r.turbidity ?? '',
    r.ec ?? '',
    r.waterLevel ?? '',
    r.isSimulated ? 'Yes' : 'No'
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports an object as a JSON file download
 */
export function exportToJSON(data: any, filename: string = 'water_quality_report.json'): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
