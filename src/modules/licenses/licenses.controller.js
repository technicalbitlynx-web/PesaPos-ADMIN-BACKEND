const service = require('./licenses.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

async function generate(req, res, next) {
  try {
    const { client_id, subscription_id } = req.body;
    const data = await service.generate(client_id, subscription_id);
    successResponse(res, { data }, 201, 'License generated');
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

async function validate(req, res, next) {
  try {
    const { license_key, device_id, fingerprint } = req.body;
    if (!license_key || !device_id) return errorResponse(res, 'license_key and device_id are required', 400);
    const result = await service.validate(license_key, device_id, fingerprint);
    res.status(result.valid ? 200 : 403).json({ success: result.valid, ...result });
  } catch (err) { next(err); }
}

async function activate(req, res, next) {
  try {
    const data = await service.activate(req.params.id);
    successResponse(res, { data }, 200, 'License activated');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function suspend(req, res, next) {
  try {
    const data = await service.suspend(req.params.id);
    successResponse(res, { data }, 200, 'License suspended');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function revoke(req, res, next) {
  try {
    const data = await service.revoke(req.params.id);
    successResponse(res, { data }, 200, 'License revoked');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function updateSlots(req, res, next) {
  try {
    const { manager_slots, pos_slots } = req.body;
    const data = await service.updateSlots(req.params.id, { manager_slots, pos_slots });
    successResponse(res, { data }, 200, 'Slots updated');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

module.exports = { generate, findAll, findOne, validate, activate, suspend, revoke, updateSlots };
