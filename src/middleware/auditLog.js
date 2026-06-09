const prisma = require('../config/database');
const logger = require('../utils/logger');

function auditLog(action, resource) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (body) {
      if (res.statusCode < 400 && req.admin) {
        try {
          const resourceId =
            req.params.id ||
            body?.data?.id ||
            body?.id ||
            null;

          await prisma.auditLog.create({
            data: {
              admin_id: req.admin.id,
              action,
              resource,
              resource_id: resourceId ? String(resourceId) : null,
              details: JSON.stringify({ method: req.method, path: req.path }),
              ip_address: req.ip,
            },
          });
        } catch (err) {
          logger.error('Audit log failed', { message: err.message });
        }
      }
      return originalJson(body);
    };

    next();
  };
}

module.exports = { auditLog };
