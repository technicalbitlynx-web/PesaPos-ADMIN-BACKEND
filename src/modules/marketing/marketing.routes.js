const router = require('express').Router();
const controller = require('./marketing.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

// Public — officer self-registration
router.post('/register', controller.register);

// Officer's own data (any authenticated SALES_MANAGER)
router.get('/my-stats',   authenticate, controller.myStats);
router.get('/my-clients', authenticate, controller.myClients);

// Admin views — list all officers, update commission
router.get('/officers',                     authenticate, authorize('admin:read'),   controller.getOfficers);
router.patch('/officers/:id/commission',    authenticate, authorize('admin:update'), controller.updateCommission);

module.exports = router;
