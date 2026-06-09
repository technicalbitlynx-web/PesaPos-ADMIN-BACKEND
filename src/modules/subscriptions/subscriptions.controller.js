const service = require('./subscriptions.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

async function getPlans(req, res, next) {
  try {
    const data = await service.getPlans(req.query);
    successResponse(res, { data });
  } catch (err) { next(err); }
}

async function createPlan(req, res, next) {
  try {
    const data = await service.createPlan(req.body);
    successResponse(res, { data }, 201, 'Plan created');
  } catch (err) { next(err); }
}

async function updatePlan(req, res, next) {
  try {
    const data = await service.updatePlan(req.params.id, req.body);
    successResponse(res, { data }, 200, 'Plan updated');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function deletePlan(req, res, next) {
  try {
    await service.deletePlan(req.params.id);
    successResponse(res, null, 200, 'Plan deleted');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { client_id, plan_id, start_date } = req.body;
    const data = await service.create(client_id, plan_id, start_date);
    successResponse(res, { data }, 201, 'Subscription created');
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

async function renew(req, res, next) {
  try {
    const data = await service.renew(req.params.id);
    successResponse(res, { data }, 200, 'Subscription renewed');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function upgrade(req, res, next) {
  try {
    const data = await service.upgrade(req.params.id, req.body.plan_id);
    successResponse(res, { data }, 200, 'Subscription upgraded');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const data = await service.cancel(req.params.id);
    successResponse(res, { data }, 200, 'Subscription cancelled');
  } catch (err) { next(err); }
}

module.exports = { getPlans, createPlan, updatePlan, deletePlan, create, findAll, findOne, renew, upgrade, cancel };
