import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";

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
    const orders = await Order.find({ user: req.user._id }).populate('items.product');
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       example: 60d5ec49f1b2c8b1f8c8e8e8
 *                     quantity:
 *                       type: number
 *                       example: 2
 *               shippingAddress:
 *                 type: string
 *                 example: "123 Main St, City, Country"
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Items and shipping address are required' });
    }

    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }
      totalAmount += product.price * item.quantity;

      // Update product stock
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      totalAmount,
      shippingAddress
    });

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