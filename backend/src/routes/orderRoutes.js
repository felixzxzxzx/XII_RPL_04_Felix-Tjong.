const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, checkRole } = require('../middlewares/auth');

router.use(verifyToken);
router.use(checkRole('admin', 'owner'));

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);

module.exports = router;
