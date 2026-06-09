const router = require('express').Router();
const controller = require('./subscriptions.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/auditLog');

router.use(authenticate);

router.get('/plans', controller.getPlans);
router.post('/plans', authorize('subscriptions:create'), controller.createPlan);
router.patch('/plans/:id', authorize('subscriptions:update'), auditLog('UPDATE', 'plan'), controller.updatePlan);
router.delete('/plans/:id', authorize('subscriptions:delete'), auditLog('DELETE', 'plan'), controller.deletePlan);

router.post('/', authorize('subscriptions:create'), auditLog('CREATE', 'subscription'), controller.create);
router.get('/', authorize('subscriptions:read'), controller.findAll);
router.get('/:id', authorize('subscriptions:read'), controller.findOne);
router.patch('/:id/renew', authorize('subscriptions:update'), auditLog('RENEW', 'subscription'), controller.renew);
router.patch('/:id/upgrade', authorize('subscriptions:update'), auditLog('UPGRADE', 'subscription'), controller.upgrade);
router.patch('/:id/cancel', authorize('subscriptions:update'), auditLog('CANCEL', 'subscription'), controller.cancel);

module.exports = router;
