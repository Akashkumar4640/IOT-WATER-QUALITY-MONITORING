import { httpClient, type ApiResponse } from './httpClient';
import type {
  SensorReading,
  Device,
  AlertItem,
  CalibrationRecord,
  ParameterThresholds,
  SystemDiagnostics
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Health check
  getHealth: async (): Promise<ApiResponse<{ status: string; backend: boolean; database: boolean; uptime: number; timestamp: string }>> => {
    return httpClient.get(`${API_BASE_URL}/health`);
  },

  // IoT Readings
  getLatestReading: async (deviceId: string): Promise<ApiResponse<SensorReading>> => {
    return httpClient.get<SensorReading>(`${API_BASE_URL}/iot/latest/${encodeURIComponent(deviceId)}`);
  },

  getHistory: async (deviceId: string, range = '1h', limit = 100): Promise<ApiResponse<SensorReading[]>> => {
    return httpClient.get<SensorReading[]>(
      `${API_BASE_URL}/iot/history/${encodeURIComponent(deviceId)}?range=${range}&limit=${limit}`
    );
  },

  sendReading: async (reading: Partial<SensorReading>): Promise<ApiResponse<SensorReading>> => {
    return httpClient.post<SensorReading>(`${API_BASE_URL}/iot/readings`, reading);
  },

  // Devices
  getDevices: async (): Promise<ApiResponse<Device[]>> => {
    return httpClient.get<Device[]>(`${API_BASE_URL}/devices`);
  },

  getDeviceStatus: async (deviceId: string): Promise<ApiResponse<any>> => {
    return httpClient.get(`${API_BASE_URL}/devices/${encodeURIComponent(deviceId)}/status`);
  },

  registerDevice: async (deviceData: {
    deviceId: string;
    deviceName: string;
    deviceToken?: string;
    firmwareVersion?: string;
    connectionType?: string;
  }): Promise<ApiResponse<Device>> => {
    return httpClient.post<Device>(`${API_BASE_URL}/devices`, deviceData);
  },

  updateDevice: async (deviceId: string, data: Partial<Device>): Promise<ApiResponse<Device>> => {
    return httpClient.put<Device>(`${API_BASE_URL}/devices/${encodeURIComponent(deviceId)}`, data);
  },

  deleteDevice: async (deviceId: string): Promise<ApiResponse<{ message: string }>> => {
    return httpClient.delete(`${API_BASE_URL}/devices/${encodeURIComponent(deviceId)}`);
  },

  // Calibration
  getCalibration: async (deviceId: string): Promise<ApiResponse<CalibrationRecord[]>> => {
    return httpClient.get<CalibrationRecord[]>(`${API_BASE_URL}/calibration/${encodeURIComponent(deviceId)}`);
  },

  saveCalibration: async (calData: {
    deviceId: string;
    sensor: string;
    calibrationParameters: any;
    referenceValues?: any;
  }): Promise<ApiResponse<CalibrationRecord>> => {
    return httpClient.post<CalibrationRecord>(`${API_BASE_URL}/calibration`, calData);
  },

  resetCalibration: async (deviceId: string, sensor: string): Promise<ApiResponse<{ message: string }>> => {
    return httpClient.delete(`${API_BASE_URL}/calibration/${encodeURIComponent(deviceId)}/${encodeURIComponent(sensor)}`);
  },

  // Alerts
  getAlerts: async (params?: {
    deviceId?: string;
    resolved?: boolean;
    severity?: string;
    limit?: number;
  }): Promise<ApiResponse<AlertItem[]>> => {
    const query = new URLSearchParams();
    if (params?.deviceId) query.append('deviceId', params.deviceId);
    if (params?.resolved !== undefined) query.append('resolved', String(params.resolved));
    if (params?.severity && params.severity !== 'ALL') query.append('severity', params.severity);
    if (params?.limit) query.append('limit', String(params.limit));

    const qs = query.toString();
    return httpClient.get<AlertItem[]>(`${API_BASE_URL}/alerts${qs ? `?${qs}` : ''}`);
  },

  resolveAlert: async (id: number): Promise<ApiResponse<AlertItem>> => {
    return httpClient.put<AlertItem>(`${API_BASE_URL}/alerts/${id}/resolve`);
  },

  clearAlerts: async (deviceId?: string): Promise<ApiResponse<{ message: string }>> => {
    const url = deviceId
      ? `${API_BASE_URL}/alerts?deviceId=${encodeURIComponent(deviceId)}`
      : `${API_BASE_URL}/alerts`;
    return httpClient.delete(url);
  },

  // Settings & Thresholds
  getThresholds: async (): Promise<ApiResponse<ParameterThresholds>> => {
    return httpClient.get<ParameterThresholds>(`${API_BASE_URL}/settings/thresholds`);
  },

  updateThresholds: async (thresholds: ParameterThresholds): Promise<ApiResponse<ParameterThresholds>> => {
    return httpClient.put<ParameterThresholds>(`${API_BASE_URL}/settings/thresholds`, thresholds);
  },

  // Diagnostics
  getDiagnostics: async (deviceId: string): Promise<ApiResponse<SystemDiagnostics>> => {
    return httpClient.get<SystemDiagnostics>(
      `${API_BASE_URL}/diagnostics/system?deviceId=${encodeURIComponent(deviceId)}`
    );
  },

  injectTestPacket: async (payload: any): Promise<ApiResponse<any>> => {
    return httpClient.post(`${API_BASE_URL}/diagnostics/test-packet`, payload);
  },

  // Samples & Location Management
  getSamples: async (): Promise<ApiResponse<import('../types').WaterSampleRecord[]>> => {
    return httpClient.get<import('../types').WaterSampleRecord[]>(`${API_BASE_URL}/samples`);
  },

  getSampleById: async (id: number | string): Promise<ApiResponse<import('../types').WaterSampleRecord>> => {
    return httpClient.get<import('../types').WaterSampleRecord>(`${API_BASE_URL}/samples/${encodeURIComponent(id)}`);
  },

  createSample: async (sampleData: {
    sampleName: string;
    location: string;
    collectionDate?: string;
    collectionTime?: string;
    collectedBy?: string;
    notes?: string;
    deviceId?: string;
    readingSnapshot?: any;
  }): Promise<ApiResponse<import('../types').WaterSampleRecord>> => {
    return httpClient.post<import('../types').WaterSampleRecord>(`${API_BASE_URL}/samples`, sampleData);
  },

  deleteSample: async (id: number | string): Promise<ApiResponse<{ deleted: boolean }>> => {
    return httpClient.delete(`${API_BASE_URL}/samples/${encodeURIComponent(id)}`);
  },

  getLocationComparison: async (): Promise<ApiResponse<import('../types').LocationComparisonItem[]>> => {
    return httpClient.get<import('../types').LocationComparisonItem[]>(`${API_BASE_URL}/samples/compare/locations`);
  },

  // AI & ML Analysis
  getAIEvaluation: async (deviceId?: string): Promise<ApiResponse<import('../types').AIEvaluationResult>> => {
    const url = deviceId ? `${API_BASE_URL}/ai/predict?deviceId=${encodeURIComponent(deviceId)}` : `${API_BASE_URL}/ai/predict`;
    return httpClient.get<import('../types').AIEvaluationResult>(url);
  },

  evaluateCustom: async (reading: Partial<SensorReading>): Promise<ApiResponse<import('../types').AIEvaluationResult>> => {
    return httpClient.post<import('../types').AIEvaluationResult>(`${API_BASE_URL}/ai/custom`, reading);
  },

  // Data Quality
  getDataQualitySummary: async (deviceId?: string): Promise<ApiResponse<import('../types').DataQualitySummary>> => {
    const url = deviceId ? `${API_BASE_URL}/data-quality/summary?deviceId=${encodeURIComponent(deviceId)}` : `${API_BASE_URL}/data-quality/summary`;
    return httpClient.get<import('../types').DataQualitySummary>(url);
  },

  // Report URLs
  getPdfReportUrl: (deviceId: string): string =>
    `${API_BASE_URL}/reports/export/pdf?deviceId=${encodeURIComponent(deviceId)}`,

  getCsvReportUrl: (deviceId: string, range = '24h'): string =>
    `${API_BASE_URL}/reports/export/csv?deviceId=${encodeURIComponent(deviceId)}&range=${range}`,

  // Dedicated TDS Drinking Water Checker APIs
  getLatestTDS: async (deviceId?: string): Promise<ApiResponse<import('../types').TDSReading>> => {
    const url = deviceId ? `${API_BASE_URL}/tds/latest?deviceId=${encodeURIComponent(deviceId)}` : `${API_BASE_URL}/tds/latest`;
    return httpClient.get<import('../types').TDSReading>(url);
  },

  getTDSHistory: async (deviceId?: string, limit = 50): Promise<ApiResponse<{ stats: import('../types').TDSHistoryStats; data: any[] }>> => {
    const url = deviceId 
      ? `${API_BASE_URL}/tds/history?deviceId=${encodeURIComponent(deviceId)}&limit=${limit}`
      : `${API_BASE_URL}/tds/history?limit=${limit}`;
    return httpClient.get<{ stats: import('../types').TDSHistoryStats; data: any[] }>(url);
  },

  sendTDSTelemetry: async (payload: { deviceId?: string; tds: number; voltage?: number; temperature?: number; notes?: string }): Promise<ApiResponse<import('../types').TDSReading>> => {
    return httpClient.post<import('../types').TDSReading>(`${API_BASE_URL}/tds/telemetry`, payload);
  },

  simulateSalt: async (payload: { action?: string; amount?: number; preset?: string }): Promise<ApiResponse<import('../types').TDSReading>> => {
    return httpClient.post<import('../types').TDSReading>(`${API_BASE_URL}/tds/simulate-salt`, payload);
  },

  // Prototype Live TDS Monitor endpoints (GET /api/tds and POST /api/tds)
  getDirectTDS: async (): Promise<DirectTDSReading> => {
    const res = await httpClient.get<DirectTDSReading>(`${API_BASE_URL}/tds`);
    // res may be either DirectTDSReading directly (due to httpClient return) or contain data
    return (res as any);
  },

  postDirectTDS: async (payload: { tds_ppm: number; raw_adc: number; status: string; device_key?: string }): Promise<ApiResponse<any>> => {
    return httpClient.post(`${API_BASE_URL}/tds`, {
      device_key: payload.device_key || 'tds-demo-2026',
      ...payload
    });
  }
};

export interface DirectTDSReading {
  tds_ppm: number | null;
  raw_adc: number | null;
  status: string | null;
  updatedAt: string | null;
  message?: string;
  success?: boolean;
}


