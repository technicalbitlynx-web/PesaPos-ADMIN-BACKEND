const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { initSocketManager } = require('./socketManager');
const config = require('../config/config');
const logger = require('../utils/logger');

function setupWebSocket(io) {
  const sm = initSocketManager(io);

  io.use((socket, next) => {
    const token      = socket.handshake.auth?.token;
    const deviceId   = socket.handshake.auth?.device_id;
    const licenseKey = socket.handshake.auth?.license_key;

    if (deviceId) {
      socket.deviceId   = deviceId;
      socket.licenseKey = licenseKey || deviceId; // fallback: old clients sent license key as device_id
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
      const deviceId   = socket.deviceId;
      const licenseKey = socket.licenseKey;
      logger.info('POS device connected', { deviceId, licenseKey });

      // Look up license → client info using the license key
      let licenseInfo = { clientId: null, businessName: 'Unknown', planName: null, expiryDate: null };
      try {
        const license = await prisma.license.findFirst({
          where: { license_key: licenseKey },
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
      sm.registerDevice(deviceId, socket.id, { ...licenseInfo, ip, licenseKey });

      // Join a room keyed by license so we can broadcast to all devices on the same license
      socket.join('license:' + licenseKey);

      // Broadcast to admin panel
      sm.broadcast('device:connected', {
        deviceId,
        licenseKey,
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

      // ── Real-time data sync between devices ──────────────────────────────
      socket.on('pos:data-push', async (payload) => {
        try {
          // Broadcast instantly — don't wait for DB persistence
          socket.to('license:' + licenseKey).emit('pos:data-push', payload);

          // Persist using last-write-wins merge so socket pushes never trample each other
          const { license_key: lk, products, sales, credits, customers, suppliers, expenses, quotations } = payload;
          if (!lk) return;

          const safeparse = (s) => { if (!s) return []; try { const a = JSON.parse(s); return Array.isArray(a) ? a : []; } catch { return []; } };
          function mergeByKey(existingJson, incoming, keyFn) {
            if (!Array.isArray(incoming) || incoming.length === 0) return existingJson;
            const ex = safeparse(existingJson);
            const map = new Map();
            for (const r of ex)       { const k = keyFn(r); if (k != null) map.set(k, r); }
            for (const r of incoming) {
              const k = keyFn(r);
              if (k == null) continue;
              const old = map.get(k);
              if (!old || (r.updatedAt || '') >= (old.updatedAt || '')) map.set(k, r);
            }
            return JSON.stringify([...map.values()]);
          }

          const existing = await prisma.posData.findUnique({ where: { license_key: lk } });
          const data = {};
          if (products)   data.products   = mergeByKey(existing?.products,   products,   r => r.id || r.barcode);
          if (sales)      data.sales       = mergeByKey(existing?.sales,       sales,       r => r.id || (r.receipt_number != null && r.barcode ? `${r.receipt_number}:${r.barcode}:${r.timestamp||''}` : null));
          if (credits)    data.credits     = mergeByKey(existing?.credits,     credits,     r => r.id);
          if (customers)  data.customers   = mergeByKey(existing?.customers,   customers,   r => r.id || r.phone);
          if (suppliers)  data.suppliers   = mergeByKey(existing?.suppliers,   suppliers,   r => r.id || r.name);
          if (expenses)   data.expenses    = mergeByKey(existing?.expenses,    expenses,    r => r.id);
          if (quotations) data.quotations  = mergeByKey(existing?.quotations,  quotations,  r => r.id);

          if (Object.keys(data).length) {
            prisma.posData.upsert({
              where: { license_key: lk },
              update: data,
              create: { license_key: lk, ...data },
            }).catch(() => {});
          }
        } catch (err) {
          logger.error('pos:data-push error', { message: err.message });
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
