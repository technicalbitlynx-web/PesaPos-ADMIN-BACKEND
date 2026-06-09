const router = require('express').Router();
const controller = require('./clients.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/auditLog');

router.use(authenticate);

router.post('/', authorize('clients:create'), auditLog('CREATE', 'client'), controller.create);
router.get('/', authorize('clients:read'), controller.findAll);
router.get('/:id', authorize('clients:read'), controller.findOne);
router.put('/:id', authorize('clients:update'), auditLog('UPDATE', 'client'), controller.update);
router.delete('/:id', authorize('clients:delete'), auditLog('DELETE', 'client'), controller.remove);
router.patch('/:id/suspend', authorize('clients:update'), auditLog('SUSPEND', 'client'), controller.suspend);
router.patch('/:id/activate', authorize('clients:update'), auditLog('ACTIVATE', 'client'), controller.activate);

module.exports = router;
