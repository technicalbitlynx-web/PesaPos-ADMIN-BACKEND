const service = require('./payments.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

async function record(req, res, next) {
  try {
    const data = await service.record(req.body, req.admin.id);
    successResponse(res, { data }, 201, 'Payment recorded');
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

async function approve(req, res, next) {
  try {
    const data = await service.approve(req.params.id, req.admin.id);
    successResponse(res, { data }, 200, 'Payment approved');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const data = await service.reject(req.params.id, req.admin.id, req.body.reason);
    successResponse(res, { data }, 200, 'Payment rejected');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function getRevenue(req, res, next) {
  try {
    const data = await service.getRevenue(req.query);
    successResponse(res, { data });
  } catch (err) { next(err); }
}

module.exports = { record, findAll, findOne, approve, reject, getRevenue };
