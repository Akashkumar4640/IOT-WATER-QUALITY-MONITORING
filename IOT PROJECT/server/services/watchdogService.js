const { DeviceModel, SettingsModel } = require('../models');
const { DateHelper, Logger } = require('../utils');
const { broadcastDeviceStatus } = require('../websocket/socketManager');
const { handleDeviceConnectionState } = require('./alertEngine');

class WatchdogService {
  constructor() {
    this.timer = null;
  }

  start(io, checkIntervalMs = 5000) {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(async () => {
      try {
        const thresholds = await SettingsModel.get('thresholds') || { offlineTimeoutSeconds: 15 };
        const timeoutSec = thresholds.offlineTimeoutSeconds || 15;

        const devices = await DeviceModel.findAll();

        for (const dev of devices) {
          if (!dev.lastSeen) continue;
          const parsedDate = DateHelper.parseSafeUtcDate(dev.lastSeen);
          if (!parsedDate || isNaN(parsedDate.getTime())) continue;

          const diffSec = (Date.now() - parsedDate.getTime()) / 1000;

          if (diffSec > timeoutSec && dev.status === 'ONLINE') {
            await DeviceModel.updateStatus(dev.deviceId, 'OFFLINE');
            broadcastDeviceStatus(dev.deviceId, 'OFFLINE', {
              message: 'Hardware connection lost. ESP32 offline.',
              secondsOffline: Math.floor(diffSec)
            });
            await handleDeviceConnectionState(dev.deviceId, false, io);
            Logger.warn('Watchdog', `Device ${dev.deviceId} marked OFFLINE (${Math.floor(diffSec)}s since last packet)`);
          }
        }
      } catch (err) {
        Logger.error('Watchdog', 'Error during device check:', err.message);
      }
    }, checkIntervalMs);

    Logger.info('Watchdog', 'Device watchdog service started.');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      Logger.info('Watchdog', 'Device watchdog service stopped.');
    }
  }
}

module.exports = new WatchdogService();
