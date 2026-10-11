import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { CalibrationRecord } from '../types';

export function useCalibration(deviceId: string) {
  const [calibrations, setCalibrations] = useState<CalibrationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalibrations = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCalibration(deviceId);
      if (res.success && res.data) {
        setCalibrations(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load calibrations');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchCalibrations();
  }, [fetchCalibrations]);

  const saveCalibration = async (payload: any) => {
    const res = await api.saveCalibration(payload);
    if (res.success) {
      await fetchCalibrations();
    }
    return res;
  };

  const resetCalibration = async (sensor: string) => {
    const res = await api.resetCalibration(deviceId, sensor);
    if (res.success) {
      await fetchCalibrations();
    }
    return res;
  };

  return {
    calibrations,
    loading,
    error,
    refetch: fetchCalibrations,
    saveCalibration,
    resetCalibration
  };
}
