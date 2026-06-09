const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const { paginate, paginatedResponse } = require('../../utils/helpers');

async function createAdmin(data) {
  const { name, email, password, role } = data;
  const exists = await prisma.adminUser.findUnique({ where: { email } });
  if (exists) throw { statusCode: 409, message: 'Email already in use' };

  const hashed = await bcrypt.hash(password, 12);
  const admin = await prisma.adminUser.create({
    data: { name, email, password: hashed, role },
  });

  const { password: _, ...safe } = admin;
  return safe;
}

async function findAll(query) {
  const { page, limit, skip } = paginate(query);
  const where = {};
  if (query.role) where.role = query.role;
  if (query.is_active !== undefined) where.is_active = query.is_active === 'true';

  const [admins, total] = await Promise.all([
    prisma.adminUser.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: { id: true, name: true, email: true, role: true, is_active: true, last_login: true, created_at: true },
    }),
    prisma.adminUser.count({ where }),
  ]);

  return paginatedResponse(admins, total, page, limit);
}

async function findOne(id) {
  const admin = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, is_active: true, last_login: true, created_at: true },
  });
  if (!admin) throw { statusCode: 404, message: 'Admin not found' };
  return admin;
}

async function update(id, data) {
  const { name, email, role, is_active } = data;
  try {
    return await prisma.adminUser.update({
      where: { id },
      data: { name, email, role, is_active },
      select: { id: true, name: true, email: true, role: true, is_active: true },
    });
  } catch (err) {
    if (err.code === 'P2025') throw { statusCode: 404, message: 'Admin not found' };
    throw err;
  }
}

async function remove(id) {
  try {
    await prisma.adminUser.delete({ where: { id } });
  } catch (err) {
    if (err.code === 'P2025') throw { statusCode: 404, message: 'Admin not found' };
    throw err;
  }
}

async function resetPassword(id, newPassword) {
  const hashed = await bcrypt.hash(newPassword, 12);
  try {
    await prisma.adminUser.update({ where: { id }, data: { password: hashed } });
  } catch (err) {
    if (err.code === 'P2025') throw { statusCode: 404, message: 'Admin not found' };
    throw err;
  }
}

async function getAuditLogs(query) {
  const { page, limit, skip } = paginate(query);
  const where = {};
  if (query.admin_id) where.admin_id = query.admin_id;
  if (query.resource) where.resource = query.resource;
  if (query.action) where.action = query.action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { admin: { select: { name: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return paginatedResponse(logs, total, page, limit);
}

module.exports = { createAdmin, findAll, findOne, update, remove, resetPassword, getAuditLogs };
