const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

router.get('/process', orderController.getPendingOrders);
router.patch('/process', orderController.updateOrderStatus);

module.exports = router;
