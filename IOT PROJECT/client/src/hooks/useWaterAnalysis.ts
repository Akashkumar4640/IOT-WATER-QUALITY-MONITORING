import { useMemo } from 'react';
import type { SensorReading, WaterQualityAnalysis } from '../types';
import { calculateClientWQI } from '../utils/wqiCalculations';

export function useWaterAnalysis(reading: Partial<SensorReading> | null): WaterQualityAnalysis {
  return useMemo(() => {
    return calculateClientWQI(reading);
  }, [reading]);
}
