const prisma = require('../../config/database');
const { paginate, paginatedResponse, addDays } = require('../../utils/helpers');

async function getPlans(query) {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { is_active: true },
    orderBy: { price: 'asc' },
  });
  return plans;
}

async function createPlan(data) {
  return prisma.subscriptionPlan.create({ data });
}

async function updatePlan(id, data) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) throw { statusCode: 404, message: 'Plan not found' };
  return prisma.subscriptionPlan.update({ where: { id }, data });
}

async function deletePlan(id) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) throw { statusCode: 404, message: 'Plan not found' };
  const active = await prisma.subscription.count({ where: { plan_id: id, status: { in: ['ACTIVE', 'PENDING'] } } });
  if (active > 0) throw { statusCode: 400, message: 'Cannot delete a plan with active subscriptions' };
  return prisma.subscriptionPlan.delete({ where: { id } });
}

async function create(clientId, planId, startDate) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw { statusCode: 404, message: 'Plan not found' };

  const start = startDate ? new Date(startDate) : new Date();
  const expiry = addDays(start, plan.duration_days);

  return prisma.subscription.create({
    data: {
      client_id: clientId,
      plan_id: planId,
      plan_name: plan.name,
      price: plan.price,
      start_date: start,
      expiry_date: expiry,
      status: 'PENDING',
    },
    include: { client: true, plan: true },
  });
}

async function findAll(query) {
  const { page, limit, skip } = paginate(query);
  const where = {};

  if (query.status) where.status = query.status;
  if (query.client_id) where.client_id = query.client_id;

  const [subs, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { client: { select: { business_name: true, email: true } }, plan: true },
    }),
    prisma.subscription.count({ where }),
  ]);

  return paginatedResponse(subs, total, page, limit);
}

async function findOne(id) {
  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: { client: true, plan: true, payments: true, licenses: true },
  });
  if (!sub) throw { statusCode: 404, message: 'Subscription not found' };
  return sub;
}

async function renew(id) {
  const sub = await findOne(id);
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: sub.plan_id } });

  const newStart = sub.status === 'EXPIRED' ? new Date() : new Date(sub.expiry_date);
  const newExpiry = addDays(newStart, plan.duration_days);

  return prisma.subscription.update({
    where: { id },
    data: { start_date: newStart, expiry_date: newExpiry, status: 'ACTIVE' },
  });
}

async function upgrade(id, newPlanId) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: newPlanId } });
  if (!plan) throw { statusCode: 404, message: 'Plan not found' };

  const now = new Date();
  const expiry = addDays(now, plan.duration_days);

  return prisma.subscription.update({
    where: { id },
    data: { plan_id: newPlanId, plan_name: plan.name, price: plan.price, start_date: now, expiry_date: expiry },
  });
}

async function activate(id) {
  return prisma.subscription.update({ where: { id }, data: { status: 'ACTIVE' } });
}

async function cancel(id) {
  return prisma.subscription.update({ where: { id }, data: { status: 'CANCELLED' } });
}

async function expireOverdue() {
  const now = new Date();
  const result = await prisma.subscription.updateMany({
    where: { status: 'ACTIVE', expiry_date: { lt: now } },
    data: { status: 'EXPIRED' },
  });

  if (result.count > 0) {
    const expiredSubs = await prisma.subscription.findMany({
      where: { status: 'EXPIRED', expiry_date: { lt: now } },
      select: { client_id: true },
    });
    const clientIds = [...new Set(expiredSubs.map((s) => s.client_id))];
    await prisma.client.updateMany({
      where: { id: { in: clientIds }, status: 'ACTIVE' },
      data: { status: 'SUSPENDED' },
    });
    await prisma.license.updateMany({
      where: { client_id: { in: clientIds }, status: 'ACTIVE' },
      data: { status: 'SUSPENDED' },
    });
  }

  return result.count;
}

module.exports = { getPlans, createPlan, updatePlan, deletePlan, create, findAll, findOne, renew, upgrade, activate, cancel, expireOverdue };
