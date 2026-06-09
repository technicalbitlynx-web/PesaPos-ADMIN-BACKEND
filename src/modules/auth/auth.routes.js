const router = require('express').Router();
const controller = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');

router.post('/login', authLimiter, controller.login);
router.post('/refresh', controller.refreshToken);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);
router.patch('/change-password', authenticate, controller.changePassword);

module.exports = router;
