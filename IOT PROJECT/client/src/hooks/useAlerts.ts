import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import type { AlertItem } from '../types';

export function useAlerts(deviceId: string, resolvedFilter?: boolean, severityFilter?: string) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const loadAlerts = useCallback(async () => {
    if (!deviceId) return;
    setError(null);
    try {
      const res = await api.getAlerts({
        deviceId,
        
        resolved: resolvedFilter,
        severity: severityFilter
      });

      if (isMountedRef.current) {
        if (res.success && res.data) {
          setAlerts(res.data);
        } else {
          const errObj = res.error;
          setError(typeof errObj === 'string' ? errObj : errObj?.message || 'Failed to load alerts');
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Error loading alerts');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [deviceId, resolvedFilter, severityFilter]);

  useEffect(() => {
    isMountedRef.current = true;
    setLoading(true);
    loadAlerts();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadAlerts]);

  const resolveAlert = useCallback(async (id: number) => {
    try {
      const res = await api.resolveAlert(id);
      if (res.success) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: 1, resolvedAt: new Date().toISOString() } : a));
        return true;
      }
    } catch (e) {
      console.error('Failed to resolve alert:', e);
    }
    return false;
  }, []);

  const clearResolved = useCallback(async () => {
    try {
      const res = await api.clearAlerts(deviceId);
      if (res.success) {
        setAlerts(prev => prev.filter(a => a.resolved === 0));
        return true;
      }
    } catch (e) {
      console.error('Failed to clear alerts:', e);
    }
    return false;
  }, [deviceId]);

  return {
    alerts,
    loading,
    error,
    refetch: loadAlerts,
    resolveAlert,
    clearResolved
  };
}
