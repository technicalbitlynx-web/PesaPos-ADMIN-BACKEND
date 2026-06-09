const jwt = require('jsonwebtoken');
const config = require('../config/config');
const redis = require('../config/redis');
const { errorResponse } = require('../utils/helpers');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  const blacklisted = await redis.get(`blacklist:${token}`);
  if (blacklisted) {
    return errorResponse(res, 'Token has been revoked', 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.admin = decoded;
    next();
  } catch (err) {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
}

module.exports = { authenticate };
