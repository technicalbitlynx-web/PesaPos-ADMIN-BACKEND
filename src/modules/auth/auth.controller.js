const authService = require('./auth.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    successResponse(res, result, 200, 'Login successful');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'Refresh token required', 400);
    const result = await authService.refreshToken(refreshToken);
    successResponse(res, result);
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await authService.logout(req.admin.id, token);
    successResponse(res, {}, 200, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  successResponse(res, { admin: req.admin });
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.admin.id, currentPassword, newPassword);
    successResponse(res, {}, 200, 'Password changed successfully');
  } catch (err) {
    if (err.statusCode) return errorResponse(res, err.message, err.statusCode);
    next(err);
  }
}

module.exports = { login, refreshToken, logout, me, changePassword };
