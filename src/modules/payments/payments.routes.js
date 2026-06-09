const router = require('express').Router();
const controller = require('./payments.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/auditLog');

router.use(authenticate);

router.post('/', authorize('payments:create'), auditLog('CREATE', 'payment'), controller.record);
router.get('/', authorize('payments:read'), controller.findAll);
router.get('/revenue', authorize('payments:read'), controller.getRevenue);
router.get('/:id', authorize('payments:read'), controller.findOne);
router.patch('/:id/approve', authorize('payments:update'), auditLog('APPROVE', 'payment'), controller.approve);
router.patch('/:id/reject', authorize('payments:update'), auditLog('REJECT', 'payment'), controller.reject);

module.exports = router;
