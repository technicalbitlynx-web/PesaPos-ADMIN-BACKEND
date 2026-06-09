const router = require('express').Router();
const controller = require('./licenses.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/auditLog');
const { posLimiter } = require('../../middleware/rateLimiter');

// Public POS endpoint — no auth required, rate limited
router.post('/validate', posLimiter, controller.validate);

router.use(authenticate);

router.post('/', authorize('licenses:create'), auditLog('CREATE', 'license'), controller.generate);
router.get('/', authorize('licenses:read'), controller.findAll);
router.get('/:id', authorize('licenses:read'), controller.findOne);
router.patch('/:id/activate', authorize('licenses:update'), auditLog('ACTIVATE', 'license'), controller.activate);
router.patch('/:id/suspend', authorize('licenses:update'), auditLog('SUSPEND', 'license'), controller.suspend);
router.patch('/:id/revoke', authorize('licenses:update'), auditLog('REVOKE', 'license'), controller.revoke);

module.exports = router;
