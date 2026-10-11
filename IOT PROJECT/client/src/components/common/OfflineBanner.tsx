import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-rose-600/90 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-center space-x-2 shadow-lg backdrop-blur-md sticky top-0 z-50 border-b border-rose-400/40">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>
        ⚠️ Internet connection lost. Sensor telemetry and charts are operating in cached offline mode.
      </span>
    </div>
  );
};
