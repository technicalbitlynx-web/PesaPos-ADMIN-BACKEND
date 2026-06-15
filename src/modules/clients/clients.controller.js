const service = require('./clients.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

async function create(req, res, next) {
  try {
    const client = await service.create({ ...req.body, onboarded_by: req.admin?.id || null });
    successResponse(res, { data: client }, 201, 'Client created');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function findAll(req, res, next) {
  try {
    const result = await service.findAll(req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

async function findOne(req, res, next) {
  try {
    const client = await service.findOne(req.params.id);
    successResponse(res, { data: client });
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const client = await service.update(req.params.id, req.body);
    successResponse(res, { data: client }, 200, 'Client updated');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id);
    successResponse(res, {}, 200, 'Client deleted');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function suspend(req, res, next) {
  try {
    const client = await service.suspend(req.params.id);
    successResponse(res, { data: client }, 200, 'Client suspended');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function activate(req, res, next) {
  try {
    const client = await service.activate(req.params.id);
    successResponse(res, { data: client }, 200, 'Client activated');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

module.exports = { create, findAll, findOne, update, remove, suspend, activate };
