import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js"; // Import Cart model
import { Product } from "../models/product.model.js"; // Import Product model
import jwt from "jsonwebtoken"; // Import jwt for token verification
import { ENV_VARS } from "../config/envVars.js"; // Import environment variables

// Helper function to get user ID from token
const getUserIdFromToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw new Error("Unauthorized - No Token Provided");
  }

  const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);
  return decoded.userId; // Assuming the userId is stored in the token
};

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders for the authenticated user
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: List of orders
 *       500:
 *         description: Internal server error
 */
export const getOrders = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req); // Get user ID from token
    const orders = await Order.find({ user: userId }).populate('items.product');
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order from the user's cart
 *     tags: [Order]
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input or insufficient stock
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Internal server error
 */
export const createOrder = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req); // Get user ID from token

    // Fetch the user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Use the total amount from the cart
    const totalAmount = cart.totalAmount;

    // Validate stock and update product stock
    for (const item of cart.items) {
      const product = await Product.findById(item.productVariant); // Assuming productVariant references Product
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.title}` });
      }

      // Update product stock
      await Product.findByIdAndUpdate(item.productVariant, {
        $inc: { stock: -item.quantity }
      });
    }

    // Create the order
    const order = await Order.create({
      userId: userId, // Use the user ID from the token
      items: cart.items, // You may want to store items in a separate OrderProduct model
      total: totalAmount, // Use the total amount from the cart
      shippingAddress: req.body.shippingAddress // Assuming you pass shipping address in the request body
    });

    // Optionally, clear the cart after creating the order
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the order
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /orders/status:
 *   put:
 *     summary: Update the status of an order
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderID:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8e8
 *               status:
 *                 type: string
 *                 example: "In-transit"
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderID, status } = req.body; // status should be either 'In-transit' or 'Cancel'
    const order = await Order.findByIdAndUpdate(orderID, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /orders/pending:
 *   get:
 *     summary: Get all pending orders
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: List of pending orders
 *       500:
 *         description: Internal server error
 */
export const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Pending' }, 'orderID orderDate total status');
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};