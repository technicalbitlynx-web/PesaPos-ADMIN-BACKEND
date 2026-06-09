const prisma = require('../../config/database');
const { paginate, paginatedResponse } = require('../../utils/helpers');

async function create(clientId, data) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw { statusCode: 404, message: 'Client not found' };

  return prisma.ticket.create({
    data: { client_id: clientId, subject: data.subject, message: data.message },
    include: { client: { select: { business_name: true, email: true } } },
  });
}

async function findAll(query) {
  const { page, limit, skip } = paginate(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.client_id) where.client_id = query.client_id;
  if (query.assigned_to) where.assigned_to = query.assigned_to;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updated_at: 'desc' },
      include: {
        client: { select: { business_name: true, email: true } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return paginatedResponse(tickets, total, page, limit);
}

async function findOne(id) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      client: true,
      replies: {
        orderBy: { created_at: 'asc' },
        include: { admin: { select: { name: true, role: true } } },
      },
    },
  });
  if (!ticket) throw { statusCode: 404, message: 'Ticket not found' };
  return ticket;
}

async function reply(ticketId, senderId, senderType, message) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw { statusCode: 404, message: 'Ticket not found' };
  if (ticket.status === 'CLOSED') throw { statusCode: 400, message: 'Ticket is closed' };

  await prisma.$transaction([
    prisma.ticketReply.create({
      data: {
        ticket_id: ticketId,
        message,
        sender_id: senderId,
        sender_type: senderType,
        admin_id: senderType === 'admin' ? senderId : null,
      },
    }),
    prisma.ticket.update({
      where: { id: ticketId },
      data: { status: senderType === 'admin' ? 'PENDING' : 'OPEN', updated_at: new Date() },
    }),
  ]);

  return findOne(ticketId);
}

async function assign(ticketId, adminId) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw { statusCode: 404, message: 'Ticket not found' };

  return prisma.ticket.update({
    where: { id: ticketId },
    data: { assigned_to: adminId },
  });
}

async function resolve(ticketId) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw { statusCode: 404, message: 'Ticket not found' };

  return prisma.ticket.update({ where: { id: ticketId }, data: { status: 'RESOLVED' } });
}

async function close(ticketId) {
  return prisma.ticket.update({ where: { id: ticketId }, data: { status: 'CLOSED' } });
}

module.exports = { create, findAll, findOne, reply, assign, resolve, close };
