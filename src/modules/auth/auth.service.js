const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../../config/database');
const redis = require('../../config/redis');
const config = require('../../config/config');

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpiresIn });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.refreshExpiresIn });
}

async function login(email, password) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.is_active) throw { statusCode: 401, message: 'Invalid credentials' };

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) throw { statusCode: 401, message: 'Invalid credentials' };

  await prisma.adminUser.update({ where: { id: admin.id }, data: { last_login: new Date() } });

  const payload = { id: admin.id, email: admin.email, role: admin.role, name: admin.name };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: admin.id });

  await redis.set(`refresh:${admin.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

  return { accessToken, refreshToken, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } };
}

async function refreshToken(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch {
    throw { statusCode: 401, message: 'Invalid refresh token' };
  }

  const stored = await redis.get(`refresh:${decoded.id}`);
  if (stored !== token) throw { statusCode: 401, message: 'Refresh token revoked' };

  const admin = await prisma.adminUser.findUnique({ where: { id: decoded.id } });
  if (!admin || !admin.is_active) throw { statusCode: 401, message: 'Admin not found' };

  const payload = { id: admin.id, email: admin.email, role: admin.role, name: admin.name };
  const newAccessToken = signAccessToken(payload);

  return { accessToken: newAccessToken };
}

async function logout(adminId, accessToken) {
  const decoded = jwt.decode(accessToken);
  const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
  if (ttl > 0) await redis.set(`blacklist:${accessToken}`, '1', 'EX', ttl);
  await redis.del(`refresh:${adminId}`);
}

async function changePassword(adminId, currentPassword, newPassword) {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  const valid = await bcrypt.compare(currentPassword, admin.password);
  if (!valid) throw { statusCode: 400, message: 'Current password is incorrect' };

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.adminUser.update({ where: { id: adminId }, data: { password: hashed } });
}

module.exports = { login, refreshToken, logout, changePassword };
