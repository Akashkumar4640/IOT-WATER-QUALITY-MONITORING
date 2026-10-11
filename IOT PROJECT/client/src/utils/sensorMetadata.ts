export interface SensorConfig {
  key: string;
  name: string;
  unit: string;
  minSafe: number;
  maxSafe: number;
  precision: number;
  color: string;
}

export const SENSORS_METADATA: Record<string, SensorConfig> = {
  ph: {
    key: 'ph',
    name: 'pH Level',
    unit: 'pH',
    minSafe: 6.5,
    maxSafe: 8.5,
    precision: 2,
    color: '#06b6d4'
  },
  temperature: {
    key: 'temperature',
    name: 'Temperature',
    unit: '°C',
    minSafe: 15.0,
    maxSafe: 30.0,
    precision: 1,
    color: '#f97316'
  },
  tds: {
    key: 'tds',
    name: 'Total Dissolved Solids',
    unit: 'ppm',
    minSafe: 0,
    maxSafe: 500,
    precision: 0,
    color: '#3b82f6'
  },
  turbidity: {
    key: 'turbidity',
    name: 'Turbidity',
    unit: 'NTU',
    minSafe: 0,
    maxSafe: 5.0,
    precision: 2,
    color: '#a855f7'
  },
  ec: {
    key: 'ec',
    name: 'Electrical Conductivity',
    unit: 'µS/cm',
    minSafe: 0,
    maxSafe: 800,
    precision: 0,
    color: '#10b981'
  },
  waterLevel: {
    key: 'waterLevel',
    name: 'Water Level',
    unit: '%',
    minSafe: 20,
    maxSafe: 100,
    precision: 1,
    color: '#38bdf8'
  }
};
