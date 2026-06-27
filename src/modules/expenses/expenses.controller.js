const service = require('./expenses.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

async function create(req, res, next) {
  try {
    const expense = await service.create(req.body, req.user?.id);
    successResponse(res, { data: expense }, 201, 'Expense recorded');
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

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id);
    successResponse(res, {}, 200, 'Expense deleted');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function meta(req, res) {
  successResponse(res, {
    data: {
      categories: service.VALID_CATEGORIES,
      sources:    service.VALID_SOURCES,
    },
  });
}

module.exports = { create, findAll, remove, meta };
