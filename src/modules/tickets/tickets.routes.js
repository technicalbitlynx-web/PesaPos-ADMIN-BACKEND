const router = require('express').Router();
const controller = require('./tickets.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/auditLog');

router.use(authenticate);

router.post('/', authorize('tickets:create'), auditLog('CREATE', 'ticket'), controller.create);
router.get('/', authorize('tickets:read'), controller.findAll);
router.get('/:id', authorize('tickets:read'), controller.findOne);
router.post('/:id/reply', authorize('tickets:update'), controller.reply);
router.patch('/:id/assign', authorize('tickets:update'), controller.assign);
router.patch('/:id/resolve', authorize('tickets:update'), auditLog('RESOLVE', 'ticket'), controller.resolve);
router.patch('/:id/close', authorize('tickets:update'), controller.close);

module.exports = router;
