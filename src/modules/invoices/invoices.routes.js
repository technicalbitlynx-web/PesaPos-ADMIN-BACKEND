const router = require('express').Router();
const controller = require('./invoices.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

router.get('/', authorize('invoices:read'), controller.findAll);
router.get('/:id', authorize('invoices:read'), controller.findOne);
router.get('/:id/download', authorize('invoices:read'), controller.download);
router.post('/:id/generate-pdf', authorize('invoices:read'), controller.generatePDF);
router.post('/:id/send-email', authorize('invoices:read'), controller.sendEmail);

module.exports = router;
