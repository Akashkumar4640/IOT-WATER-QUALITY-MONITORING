import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { SensorReading, WQIResult, Device, AlertItem } from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

interface HardwareContextType {
  activeDeviceId: string;
  setActiveDeviceId: (id: string) => void;
  devices: Device[];
  activeDevice: Device | null;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  latestReading: SensorReading | null;
  wqi: WQIResult | null;
  deviceStatus: 'ONLINE' | 'OFFLINE';
  activeAlerts: AlertItem[];
  lastPacketTime: Date | null;
  isStale: boolean;
  sensorsConnectedCount: number;
  backendConnected: boolean;
  databaseConnected: boolean;
  socketConnected: boolean;
  refreshDevices: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  simulatePacket: () => Promise<void>;
}

export function parseSafeUtcDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const str = String(dateStr).trim();
  if (str.endsWith('Z') || str.includes('T')) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  // SQLite format "YYYY-MM-DD HH:MM:SS" -> UTC
  const d = new Date(str.replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? new Date(str) : d;
}

const HardwareContext = createContext<HardwareContextType | undefined>(undefined);

export const HardwareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDeviceId, setActiveDeviceId] = useState<string>('WQ-ESP32-001');
  const [devices, setDevices] = useState<Device[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [wqi, setWQI] = useState<WQIResult | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [lastPacketTime, setLastPacketTime] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [databaseConnected, setDatabaseConnected] = useState<boolean>(true);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);

  // Health check and connectivity sync
  const checkHealth = useCallback(async () => {
    try {
      const res = await api.getHealth();
      if (isMountedRef.current) {
        if (res.success && res.data) {
          setBackendConnected(true);
          setDatabaseConnected(res.data.database !== false);
        } else {
          setBackendConnected(false);
          setDatabaseConnected(false);
        }
      }
    } catch {
      if (isMountedRef.current) {
        setBackendConnected(false);
        setDatabaseConnected(false);
      }
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const res = await api.getDevices();
      if (isMountedRef.current && res.success && res.data) {
        setDevices(res.data);
        const current = res.data.find((d: Device) => d.deviceId === activeDeviceId);
        if (current) {
          setDeviceStatus(current.status);
          if (current.lastSeen) {
            const parsed = parseSafeUtcDate(current.lastSeen);
            if (parsed) setLastPacketTime(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load devices:', e);
    }
  }, [activeDeviceId]);

  const refreshAlerts = useCallback(async () => {
    try {
      const res = await api.getAlerts({ deviceId: activeDeviceId, resolved: false });
      if (isMountedRef.current && res.success && res.data) {
        setActiveAlerts(res.data);
      }
    } catch (e) {
      console.warn('Failed to load alerts:', e);
    }
  }, [activeDeviceId]);

  const loadLatestTelemetry = useCallback(async () => {
    try {
      const res = await api.getLatestReading(activeDeviceId);
      if (isMountedRef.current && res.success && res.data) {
        setLatestReading(res.data);
        setWQI(res.wqi);
        if (res.data.timestamp) {
          const parsed = parseSafeUtcDate(res.data.timestamp);
          if (parsed) setLastPacketTime(parsed);
        }
      }
    } catch {
      // Offline fallback
    }
  }, [activeDeviceId]);

  // Track data staleness (if older than 20 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!lastPacketTime) {
        setIsStale(true);
        return;
      }
      const ageSec = (Date.now() - lastPacketTime.getTime()) / 1000;
      setIsStale(ageSec > 20);
    }, 2000);

    return () => clearInterval(timer);
  }, [lastPacketTime]);

  // Periodic health check
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // WebSocket Subscription
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit('subscribe_device', activeDeviceId);
    };
    const handleDisconnect = () => setSocketConnected(false);

    if (socket.connected) {
      setSocketConnected(true);
      socket.emit('subscribe_device', activeDeviceId);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    socket.emit('subscribe_device', activeDeviceId);

    const handleReading = (data: SensorReading & { wqi?: WQIResult }) => {
      if (!isMountedRef.current) return;
      if (data.deviceId === activeDeviceId) {
        setLatestReading(data);
        if (data.wqi) setWQI(data.wqi);
        setDeviceStatus('ONLINE');
        setLastPacketTime(new Date());
        setIsStale(false);
      }
    };

    const handleStatus = (data: { deviceId: string; status: 'ONLINE' | 'OFFLINE' }) => {
      if (!isMountedRef.current) return;
      if (data.deviceId === activeDeviceId) {
        setDeviceStatus(data.status);
      }
    };

    const handleNewAlert = (alert: AlertItem) => {
      if (!isMountedRef.current) return;
      if (alert.deviceId === activeDeviceId) {
        setActiveAlerts(prev => [alert, ...prev.filter(a => a.id !== alert.id)]);
      }
    };

    const handleResolved = (data: any) => {
      if (!isMountedRef.current) return;
      if (data.deviceId === activeDeviceId) {
        setActiveAlerts(prev => prev.filter(a => {
          if (data.id !== undefined && a.id === data.id) return false;
          if (data.sensor && a.sensor === data.sensor) return false;
          return true;
        }));
      }
    };

    socket.on('sensor_reading', handleReading);
    socket.on('device_status', handleStatus);
    socket.on('new_alert', handleNewAlert);
    socket.on('alert_resolved', handleResolved);

    return () => {
      socket.emit('unsubscribe_device', activeDeviceId);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('sensor_reading', handleReading);
      socket.off('device_status', handleStatus);
      socket.off('new_alert', handleNewAlert);
      socket.off('alert_resolved', handleResolved);
    };
  }, [activeDeviceId]);

  useEffect(() => {
    isMountedRef.current = true;
    refreshDevices();
    refreshAlerts();
    loadLatestTelemetry();

    return () => {
      isMountedRef.current = false;
    };
  }, [refreshDevices, refreshAlerts, loadLatestTelemetry]);

  // Demo Simulation Handler
  const simulatePacket = useCallback(async () => {
    const rand = (min: number, max: number, decimals = 2) => +(min + Math.random() * (max - min)).toFixed(decimals);
    const phVal = rand(6.8, 7.8, 2);
    const tempVal = rand(24.0, 28.5, 1);
    const tdsVal = Math.round(rand(280, 360, 0));
    const turbVal = rand(1.2, 3.2, 2);
    const ecVal = Math.round(tdsVal * 1.45);
    const lvlVal = rand(70, 90, 1);

    await api.injectTestPacket({
      deviceId: activeDeviceId,
      ph: phVal,
      temperature: tempVal,
      tds: tdsVal,
      turbidity: turbVal,
      ec: ecVal,
      waterLevel: lvlVal,
      isSimulated: true
    });
  }, [activeDeviceId]);

  useEffect(() => {
    if (!isDemoMode) return;

    simulatePacket();

    const interval = setInterval(() => {
      simulatePacket();
    }, 4000);

    return () => clearInterval(interval);
  }, [isDemoMode, simulatePacket]);

  let sensorsConnectedCount = 0;
  if (latestReading) {
    if (latestReading.ph !== null && latestReading.ph !== undefined) sensorsConnectedCount++;
    if (latestReading.temperature !== null && latestReading.temperature !== undefined) sensorsConnectedCount++;
    if (latestReading.tds !== null && latestReading.tds !== undefined) sensorsConnectedCount++;
    if (latestReading.turbidity !== null && latestReading.turbidity !== undefined) sensorsConnectedCount++;
    if (latestReading.ec !== null && latestReading.ec !== undefined) sensorsConnectedCount++;
  }

  const activeDevice = devices.find(d => d.deviceId === activeDeviceId) || null;

  return (
    <HardwareContext.Provider
      value={{
        activeDeviceId,
        setActiveDeviceId,
        devices,
        activeDevice,
        isDemoMode,
        setIsDemoMode,
        latestReading,
        wqi,
        deviceStatus,
        activeAlerts,
        lastPacketTime,
        isStale,
        sensorsConnectedCount,
        backendConnected,
        databaseConnected,
        socketConnected,
        refreshDevices,
        refreshAlerts,
        simulatePacket
      }}
    >
      {children}
    </HardwareContext.Provider>
  );
};

export const useHardware = () => {
  const context = useContext(HardwareContext);
  if (!context) {
    throw new Error('useHardware must be used within a HardwareProvider');
  }
  return context;
};
