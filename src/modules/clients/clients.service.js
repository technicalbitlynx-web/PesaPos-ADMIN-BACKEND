const prisma = require('../../config/database');
const { paginate, paginatedResponse } = require('../../utils/helpers');

async function create(data) {
  return prisma.client.create({ data });
}

async function findAll(query) {
  const { page, limit, skip } = paginate(query);
  const where = {};

  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { business_name: { contains: query.search } },
      { owner_name: { contains: query.search } },
      { email: { contains: query.search } },
    ];
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { subscriptions: true, licenses: true } } },
    }),
    prisma.client.count({ where }),
  ]);

  return paginatedResponse(clients, total, page, limit);
}

async function findOne(id) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      subscriptions: { orderBy: { created_at: 'desc' }, take: 5 },
      licenses: { orderBy: { created_at: 'desc' }, take: 5 },
      _count: { select: { payments: true, tickets: true } },
    },
  });
  if (!client) throw { statusCode: 404, message: 'Client not found' };
  return client;
}

async function update(id, data) {
  try {
    return await prisma.client.update({ where: { id }, data });
  } catch (err) {
    if (err.code === 'P2025') throw { statusCode: 404, message: 'Client not found' };
    throw err;
  }
}

async function remove(id) {
  try {
    await prisma.client.delete({ where: { id } });
  } catch (err) {
    if (err.code === 'P2025') throw { statusCode: 404, message: 'Client not found' };
    throw err;
  }
}

async function suspend(id) {
  return update(id, { status: 'SUSPENDED' });
}

async function activate(id) {
  return update(id, { status: 'ACTIVE' });
}

module.exports = { create, findAll, findOne, update, remove, suspend, activate };
