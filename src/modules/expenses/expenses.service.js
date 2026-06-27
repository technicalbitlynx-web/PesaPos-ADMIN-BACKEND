const { v4: uuidv4 } = require('uuid');
const prisma = require('../../config/database');
const { paginate, paginatedResponse } = require('../../utils/helpers');

const VALID_CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Transport', 'Equipment', 'Supplies', 'Maintenance', 'Tax', 'Other'];
const VALID_SOURCES    = ['Cash', 'Bank Transfer', 'Mobile Money', 'Petty Cash', 'Business Account', 'Credit Card', 'Other'];

async function create(data, adminId) {
  const { amount, category, description, source, paid_by, reference, date } = data;
  if (!amount || !category || !description || !source) {
    throw { statusCode: 400, message: 'amount, category, description and source are required' };
  }
  const expense = await prisma.adminExpense.create({
    data: {
      id: uuidv4(),
      amount: Number(amount),
      category,
      description,
      source,
      paid_by: paid_by || null,
      reference: reference || null,
      date: date ? new Date(date) : new Date(),
      created_by: adminId || null,
    },
    include: { creator: { select: { name: true, email: true } } },
  });
  return expense;
}

async function findAll(query) {
  const { category, source, start, end } = query;
  const where = {};
  if (category) where.category = category;
  if (source)   where.source   = source;
  if (start || end) {
    where.date = {};
    if (start) where.date.gte = new Date(start);
    if (end)   where.date.lte = new Date(end);
  }

  const { page, limit, skip } = paginate(query);
  const [items, total, all] = await Promise.all([
    prisma.adminExpense.findMany({
      where,
      include: { creator: { select: { name: true } } },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.adminExpense.count({ where }),
    prisma.adminExpense.findMany({ where, select: { amount: true, category: true, source: true } }),
  ]);

  const totalAmount = all.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory  = all.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + Number(e.amount); return acc; }, {});
  const bySource    = all.reduce((acc, e) => { acc[e.source]   = (acc[e.source]   || 0) + Number(e.amount); return acc; }, {});

  return { ...paginatedResponse(items, total, page, limit), totalAmount, byCategory, bySource };
}

async function remove(id) {
  const existing = await prisma.adminExpense.findUnique({ where: { id } });
  if (!existing) throw { statusCode: 404, message: 'Expense not found' };
  await prisma.adminExpense.delete({ where: { id } });
}

module.exports = { create, findAll, remove, VALID_CATEGORIES, VALID_SOURCES };
