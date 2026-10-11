import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import type { SensorReading } from '../types';

export function useHistoricalData(deviceId: string, range = '30m', limit = 100) {
  const [data, setData] = useState<SensorReading[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!deviceId) return;
    setError(null);

    try {
      const res = await api.getHistory(deviceId, range, limit);
      if (isMountedRef.current) {
        if (res.success && res.data) {
          setData(res.data);
          setStats(res.stats || {});
        } else {
          const errObj = res.error;
          const errMsg = typeof errObj === 'string' ? errObj : errObj?.message || 'Failed to fetch history';
          setError(errMsg);
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Error loading history');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [deviceId, range, limit]);

  useEffect(() => {
    isMountedRef.current = true;
    setLoading(true);
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  // Appends a single real-time reading safely to local history without doing an expensive HTTP refetch
  const appendReading = useCallback((newReading: SensorReading) => {
    setData((prev) => {
      // Avoid duplicate timestamps
      if (prev.length > 0 && prev[prev.length - 1].timestamp === newReading.timestamp) {
        return prev;
      }
      const updated = [...prev, newReading];
      // Keep only up to limit elements in memory
      if (updated.length > limit) {
        return updated.slice(updated.length - limit);
      }
      return updated;
    });
  }, [limit]);

  return {
    data,
    stats,
    loading,
    error,
    refetch: fetchData,
    appendReading
  };
}
