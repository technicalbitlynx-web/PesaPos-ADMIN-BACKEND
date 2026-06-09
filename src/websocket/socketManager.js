let instance = null;

class SocketManager {
  constructor(io) {
    this.io = io;
    this.deviceSockets = new Map(); // deviceId -> { socketId, ...meta }
    this.clientSockets = new Map(); // clientId -> Set<socketId>
  }

  registerDevice(deviceId, socketId, meta = {}) {
    this.deviceSockets.set(deviceId, {
      socketId,
      connectedAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      currentUser: null,
      salesToday: 0,
      cartItems: 0,
      ...meta,
    });
  }

  updateDeviceMeta(deviceId, meta) {
    const existing = this.deviceSockets.get(deviceId);
    if (existing) {
      this.deviceSockets.set(deviceId, {
        ...existing,
        ...meta,
        lastHeartbeat: new Date().toISOString(),
      });
    }
  }

  unregisterDevice(deviceId) {
    this.deviceSockets.delete(deviceId);
  }

  registerClientAdmin(clientId, socketId) {
    if (!this.clientSockets.has(clientId)) this.clientSockets.set(clientId, new Set());
    this.clientSockets.get(clientId).add(socketId);
  }

  unregisterClientAdmin(clientId, socketId) {
    const sockets = this.clientSockets.get(clientId);
    if (sockets) sockets.delete(socketId);
  }

  notifyDevice(deviceId, event, payload) {
    const device = this.deviceSockets.get(deviceId);
    if (device) {
      this.io.to(device.socketId).emit(event, payload);
      return true;
    }
    return false;
  }

  notifyClient(clientId, event, payload) {
    const sockets = this.clientSockets.get(clientId);
    if (sockets && sockets.size > 0) {
      sockets.forEach((socketId) => this.io.to(socketId).emit(event, payload));
      return true;
    }
    return false;
  }

  broadcast(event, payload) {
    this.io.emit(event, payload);
  }

  getConnectedDevices() {
    return Array.from(this.deviceSockets.keys());
  }

  getConnectedDevicesMeta() {
    return Array.from(this.deviceSockets.entries()).map(([deviceId, data]) => {
      const { socketId, ...meta } = data;
      return { deviceId, online: true, ...meta };
    });
  }
}

function initSocketManager(io) {
  instance = new SocketManager(io);
  return instance;
}

function getSocketManager() {
  return instance;
}

module.exports = { initSocketManager, getSocketManager };
