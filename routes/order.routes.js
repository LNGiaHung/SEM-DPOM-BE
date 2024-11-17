import express from 'express';
import {
  getAllOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
  getPendingOrders
} from '../controllers/order.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Order
 *   description: Order management
 */

// Route to get all orders for the authenticated user
router.get('/', getAllOrders);

// Route to create a new order
router.post('/', createOrder);

// Route to get an order by ID
router.get('/:id', getOrderById);

// Route to update the status of an order
router.put('/status', updateOrderStatus);

// Route to get all pending orders
router.get('/pending', getPendingOrders);

export default router;