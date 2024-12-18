import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  getOrderDetails,
  getPendingOrders
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
router.post('/', createOrder);                          // Create new order
router.get('/', getAllOrders);                          // Get all orders (admin)
router.get('/user', getUserOrders);                     // Get user's orders
router.get('/pending', getPendingOrders);               // Get pending orders
router.get('/detail/:orderId', getOrderDetails);        // Get detailed order info
router.get('/id/:orderId', getOrderById);              // Get basic order info
router.put('/status', updateOrderStatus);               // Update order status

export default router;