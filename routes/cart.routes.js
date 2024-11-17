import express from 'express';
import { getCart, addToCart, updateCartItem } from '../controllers/cart.controller.js';
// import { protectRoute } from '../middleware/protectRoute.js'; // Assuming you have a middleware for protecting routes

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Cart management
 */

// Route to get the user's cart
router.get('/', getCart);

// Route to add a product to the cart
router.post('/', addToCart);

// Route to update an item in the cart
router.put('/item', updateCartItem);

export default router;