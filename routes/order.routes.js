import express from 'express';
import {
  createOrder,
  getOrderDetails,
  getUserOrders,
  updateOrderStatus,
  deleteOrder
} from '../controllers/order.controller.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Order
 *   description: Order management
 */

// All routes require authentication
router.use(protectRoute);

// Order routes
router.post('/', createOrder);
router.get('/user', getUserOrders);
router.get('/:orderId', getOrderDetails);
router.put('/:orderId/status', updateOrderStatus);
router.delete('/:orderId', deleteOrder);

export default router;