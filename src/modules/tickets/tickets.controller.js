const service = require('./tickets.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

async function create(req, res, next) {
  try {
    const { client_id, subject, message } = req.body;
    const data = await service.create(client_id, { subject, message });
    successResponse(res, { data }, 201, 'Ticket created');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function findAll(req, res, next) {
  try {
    const result = await service.findAll(req.query);
    successResponse(res, result);
  } catch (err) { next(err); }
}

async function findOne(req, res, next) {
  try {
    const data = await service.findOne(req.params.id);
    successResponse(res, { data });
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function reply(req, res, next) {
  try {
    const data = await service.reply(req.params.id, req.admin.id, 'admin', req.body.message);
    successResponse(res, { data }, 200, 'Reply added');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function assign(req, res, next) {
  try {
    const data = await service.assign(req.params.id, req.body.admin_id);
    successResponse(res, { data }, 200, 'Ticket assigned');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function resolve(req, res, next) {
  try {
    const data = await service.resolve(req.params.id);
    successResponse(res, { data }, 200, 'Ticket resolved');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function close(req, res, next) {
  try {
    const data = await service.close(req.params.id);
    successResponse(res, { data }, 200, 'Ticket closed');
  } catch (err) { next(err); }
}

module.exports = { create, findAll, findOne, reply, assign, resolve, close };
