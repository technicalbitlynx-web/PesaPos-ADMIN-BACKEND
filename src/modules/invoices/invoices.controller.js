const service = require('./invoices.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

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

async function generatePDF(req, res, next) {
  try {
    await service.generatePDF(req.params.id);
    successResponse(res, {}, 200, 'PDF generated');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function sendEmail(req, res, next) {
  try {
    await service.sendEmail(req.params.id);
    successResponse(res, {}, 200, 'Invoice sent via email');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function download(req, res, next) {
  try {
    await service.download(req.params.id, res);
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

module.exports = { findAll, findOne, generatePDF, sendEmail, download };
