let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Allow client to subscribe to a specific device stream
    socket.on('subscribe_device', (deviceId) => {
      socket.join(`device:${deviceId}`);
      console.log(`[Socket.IO] Client ${socket.id} joined room: device:${deviceId}`);
    });

    socket.on('unsubscribe_device', (deviceId) => {
      socket.leave(`device:${deviceId}`);
      console.log(`[Socket.IO] Client ${socket.id} left room: device:${deviceId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
}

function getIO() {
  return ioInstance;
}

function broadcastTelemetry(reading, wqiData) {
  if (!ioInstance) return;
  const payload = {
    ...reading,
    wqi: wqiData
  };
  // Broadcast once globally with deviceId attached
  ioInstance.emit('sensor_reading', payload);
}

function broadcastDeviceStatus(deviceId, status, metadata = {}) {
  if (!ioInstance) return;
  ioInstance.emit('device_status', {
    deviceId,
    status,
    ...metadata,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  initSocket,
  getIO,
  broadcastTelemetry,
  broadcastDeviceStatus
};
