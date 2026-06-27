const router = require('express').Router();
const controller = require('./expenses.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/meta',  controller.meta);
router.get('/',      controller.findAll);
router.post('/',     controller.create);
router.delete('/:id', controller.remove);

module.exports = router;
