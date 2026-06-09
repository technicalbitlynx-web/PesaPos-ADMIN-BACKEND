const crypto = require('crypto');

function paginate(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

function hashFingerprint(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `INV-${year}${month}-${random}`;
}

function parseDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${dateStr}`);
  return d;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function successResponse(res, data, statusCode = 200, message = 'Success') {
  return res.status(statusCode).json({ success: true, message, ...data });
}

function errorResponse(res, message, statusCode = 400, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = {
  paginate,
  paginatedResponse,
  hashFingerprint,
  generateInvoiceNumber,
  parseDate,
  addDays,
  successResponse,
  errorResponse,
};
