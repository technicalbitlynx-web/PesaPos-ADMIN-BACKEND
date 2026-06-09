const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { initSocketManager } = require('./socketManager');
const config = require('../config/config');
const logger = require('../utils/logger');

function setupWebSocket(io) {
  const sm = initSocketManager(io);

  io.use((socket, next) => {
    const token    = socket.handshake.auth?.token;
    const deviceId = socket.handshake.auth?.device_id;

    if (deviceId) {
      socket.deviceId = deviceId;
      socket.connectionType = 'pos';
      return next();
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        socket.admin = decoded;
        socket.connectionType = 'admin';
        return next();
      } catch {
        return next(new Error('Authentication failed'));
      }
    }

    next(new Error('Authentication required'));
  });

  io.on('connection', async (socket) => {

    // ── POS device connection ─────────────────────────────────────────────
    if (socket.connectionType === 'pos') {
      const deviceId = socket.deviceId;
      logger.info('POS device connected', { deviceId });

      // Look up license → client info
      let licenseInfo = { clientId: null, businessName: 'Unknown', planName: null, expiryDate: null };
      try {
        const license = await prisma.license.findFirst({
          where: { license_key: deviceId },
          include: { client: { select: { id: true, business_name: true } }, subscription: { select: { plan_name: true, expiry_date: true } } },
        });
        if (license) {
          licenseInfo = {
            clientId:     license.client?.id || null,
            businessName: license.client?.business_name || 'Unknown',
            planName:     license.subscription?.plan_name || null,
            expiryDate:   license.expiry_date || license.subscription?.expiry_date || null,
            licenseStatus: license.status,
          };
        }
      } catch (err) {
        logger.error('License lookup on WS connect failed', { message: err.message });
      }

      const ip = socket.handshake.address;
      sm.registerDevice(deviceId, socket.id, { ...licenseInfo, ip });

      // Broadcast to admin panel
      sm.broadcast('device:connected', {
        deviceId,
        online: true,
        connectedAt: new Date().toISOString(),
        ip,
        ...licenseInfo,
      });

      // ── Heartbeat ────────────────────────────────────────────────────────
      socket.on('pos:heartbeat', async (data) => {
        try {
          const license = await prisma.license.findFirst({
            where: { license_key: deviceId, status: 'ACTIVE' },
          });

          sm.updateDeviceMeta(deviceId, {
            currentUser: data?.currentUser || null,
            salesToday:  data?.salesToday  || 0,
            cartItems:   data?.cartItems   || 0,
          });

          socket.emit('pos:heartbeat:ack', {
            timestamp: new Date().toISOString(),
            status: license ? 'valid' : 'invalid',
          });

          // Notify admin panel of updated device state
          sm.broadcast('device:update', {
            deviceId,
            currentUser: data?.currentUser || null,
            salesToday:  data?.salesToday  || 0,
            cartItems:   data?.cartItems   || 0,
            lastHeartbeat: new Date().toISOString(),
          });
        } catch (err) {
          logger.error('Heartbeat error', { message: err.message });
        }
      });

      // ── Disconnect ───────────────────────────────────────────────────────
      socket.on('disconnect', () => {
        logger.info('POS device disconnected', { deviceId });
        sm.broadcast('device:disconnected', { deviceId });
        sm.unregisterDevice(deviceId);
      });
    }

    // ── Admin connection ──────────────────────────────────────────────────
    if (socket.connectionType === 'admin') {
      logger.info('Admin connected via WebSocket', { adminId: socket.admin.id });

      socket.on('admin:watch:client', (clientId) => {
        sm.registerClientAdmin(clientId, socket.id);
      });

      // Admin sends a command to a specific POS device
      socket.on('admin:device:command', ({ deviceId, command, payload }) => {
        logger.info('Admin device command', { adminId: socket.admin.id, deviceId, command });
        sm.notifyDevice(deviceId, `pos:${command}`, payload || {});
      });

      // Admin broadcasts a message to ALL connected POS devices
      socket.on('admin:broadcast', (payload) => {
        if (socket.admin.role === 'SUPER_ADMIN') {
          sm.broadcast('pos:message', { from: socket.admin.name, ...payload });
        }
      });

      socket.on('disconnect', () => {
        logger.info('Admin WebSocket disconnected', { adminId: socket.admin.id });
      });
    }
  });

  return sm;
}

module.exports = { setupWebSocket };
