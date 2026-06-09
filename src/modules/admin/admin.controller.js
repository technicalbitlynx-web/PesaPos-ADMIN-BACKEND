const service = require('./admin.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

async function createAdmin(req, res, next) {
  try {
    const data = await service.createAdmin(req.body);
    successResponse(res, { data }, 201, 'Admin created');
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

async function update(req, res, next) {
  try {
    const data = await service.update(req.params.id, req.body);
    successResponse(res, { data }, 200, 'Admin updated');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id);
    successResponse(res, {}, 200, 'Admin deleted');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    await service.resetPassword(req.params.id, req.body.new_password);
    successResponse(res, {}, 200, 'Password reset successfully');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const result = await service.getAuditLogs(req.query);
    successResponse(res, result);
  } catch (err) { next(err); }
}

module.exports = { createAdmin, findAll, findOne, update, remove, resetPassword, getAuditLogs };
