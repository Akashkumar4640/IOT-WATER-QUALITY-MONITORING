export interface RawADCData {
  ph?: { adc: number; voltage: number };
  temperature?: { raw: string };
  tds?: { adc: number; voltage: number };
  turbidity?: { adc: number; voltage: number };
  ec?: { adc: number; voltage: number };
  waterLevel?: { adc: number; voltage: number };
}

export interface SensorReading {
  id?: number;
  deviceId: string;
  timestamp: string;
  ph: number | null;
  temperature: number | null;
  tds: number | null;
  turbidity: number | null;
  ec: number | null;
  waterLevel: number | null;
  rawValues?: RawADCData | null;
  isSimulated?: boolean;
}

export interface Device {
  id: number;
  deviceId: string;
  deviceName: string;
  deviceToken: string;
  status: 'ONLINE' | 'OFFLINE';
  firmwareVersion: string;
  connectionType: string;
  lastSeen: string;
  ipAddress?: string;
  rssi?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: number;
  deviceId: string;
  sensor: string;
  value: number;
  threshold: string;
  severity: 'CRITICAL' | 'WARNING' | 'HARDWARE' | 'CONNECTION' | 'RESOLVED';
  message: string;
  timestamp: string;
  resolved: number;
  resolvedAt?: string;
}

// Backward-compatible alias for Alert
export type AlertItem = Alert;

export interface Calibration {
  id?: number;
  deviceId: string;
  sensor: string;
  calibrationParameters: Record<string, any>;
  referenceValues: Record<string, any>;
  calibrationDate: string;
  status: string;
}

// Backward-compatible alias for Calibration
export type CalibrationRecord = Calibration;

export interface WaterSample {
  id?: string | number;
  deviceId: string;
  timestamp: string;
  ph: number | null;
  temperature: number | null;
  tds: number | null;
  turbidity: number | null;
  ec: number | null;
  waterLevel: number | null;
  isCalibrated?: boolean;
  notes?: string;
}

export interface WaterQualityAnalysis {
  score: number | null;
  grade?: string;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' | 'WARNING' | 'UNAVAILABLE';
  color: 'green' | 'cyan' | 'orange' | 'red' | 'gray';
  label: string;
  message: string;
  potable?: boolean;
  activeSensors: number;
  disclaimer?: string;
  parameters?: Record<string, {
    value: number | null;
    status: string;
    standard: string;
    weight?: number;
  }>;
}

// Backward-compatible alias for WQIResult
export type WQIResult = WaterQualityAnalysis;

export interface ParameterThresholds {
  ph: { min: number; max: number; criticalMin: number; criticalMax: number; unit: string };
  temperature: { min: number; max: number; criticalMin: number; criticalMax: number; unit: string };
  tds: { warning: number; max: number; criticalMax: number; unit: string };
  turbidity: { warning: number; max: number; criticalMax: number; unit: string };
  ec: { warning: number; max: number; criticalMax: number; unit: string };
  waterLevel: { min: number; max: number; unit: string };
  offlineTimeoutSeconds: number;
}

export interface SystemDiagnostics {
  backend: {
    status: string;
    uptime: number;
    nodeVersion: string;
    memoryUsage: Record<string, number>;
    timestamp: string;
  };
  database: {
    status: string;
    latencyMs: number;
    engine: string;
  };
  mqtt: {
    status: string;
    broker: string;
    topics: string[];
  };
  device: {
    deviceId: string;
    deviceName: string;
    status: 'ONLINE' | 'OFFLINE';
    firmwareVersion: string;
    connectionType: string;
    lastSeen: string;
    secondsSinceLastPacket: number | null;
    packetStatus: 'VALID' | 'STALE' | 'NO_DATA';
  } | null;
  sensorStatus: {
    ph: 'CONNECTED' | 'DISCONNECTED';
    temperature: 'CONNECTED' | 'DISCONNECTED';
    tds: 'CONNECTED' | 'DISCONNECTED';
    turbidity: 'CONNECTED' | 'DISCONNECTED';
    ec: 'CONNECTED' | 'DISCONNECTED';
    waterLevel: 'CONNECTED' | 'DISCONNECTED';
  };
  rawTelemetry: {
    reading: SensorReading | null;
    rawValues: RawADCData;
  };
}

export interface WaterSampleRecord {
  id: number;
  sampleId: string;
  sampleName: string;
  location: string;
  collectionDate: string;
  collectionTime: string;
  collectedBy: string;
  notes?: string;
  deviceId?: string;
  readingSnapshot?: Partial<SensorReading>;
  createdAt: string;
}

export interface LocationComparisonItem {
  location: string;
  sampleCount: number;
  avgPh: number | null;
  avgTds: number | null;
  avgTurbidity: number | null;
  avgTemp: number | null;
  lastTested: string;
}

export interface AIEvaluationResult {
  prediction: string;
  safetyLevel: 'SAFE' | 'MODERATE' | 'CRITICAL' | 'UNKNOWN';
  potable: boolean;
  confidence: number;
  anomalyScore: number;
  primaryFactor: string;
  features: Array<{
    name: string;
    value: number;
    unit: string;
    importance: number;
    status: string;
    anomalyWeight: number;
  }>;
  recommendations: string[];
  modelInfo?: {
    architecture: string;
    version: string;
    trainedFeatures: string[];
    validationStandard: string;
  };
  timestamp: string;
}

export interface DataQualitySummary {
  total: number;
  valid: number;
  invalid: number;
  missing: number;
  duplicates: number;
  stale: number;
  validityRate: number;
  rejectionReasons: Record<string, number>;
  latestPacketHealth: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
}

export interface TDSComponentBreakdown {
  name: string;
  percentage: number;
  estPpm: number;
  formula: string;
  role: string;
}

export interface TDSReading {
  id?: number;
  deviceId: string;
  timestamp: string;
  tds: number;
  voltage?: number;
  temperature?: number;
  rawAdc?: number;
  statusCode: 'DRINKABLE' | 'CAUTION' | 'UNSAFE' | 'INVALID';
  statusLabel: string;
  color: 'emerald' | 'amber' | 'rose' | 'slate';
  grade: string;
  drinkable: boolean;
  likelyComponents: string;
  advisory: string;
  breakdown: TDSComponentBreakdown[];
}

export interface TDSHistoryStats {
  totalReadings: number;
  current: number;
  min: number;
  max: number;
  avg: number;
  drinkableCount: number;
  cautionCount: number;
  unsafeCount: number;
}

