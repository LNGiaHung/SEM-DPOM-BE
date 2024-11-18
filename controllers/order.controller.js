import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js"; // Import Cart model
import { Product } from "../models/product.model.js"; // Import Product model
import { ProductVariant } from "../models/productVariant.model.js"; // Import ProductVariant model
import { OrderProduct } from "../models/orderProduct.model.js"; // Import OrderProduct model
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

    // Check if the cart is empty
    if (cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Cannot create an order.' });
    }

    // Validate stock and prepare order items
    const orderItems = [];
    for (const item of cart.items) {
      const productVariant = await ProductVariant.findById(item.productVariant); // Fetch the product variant
      if (!productVariant) {
        return res.status(404).json({ success: false, message: `Product variant not found` });
      }

      // Check if the requested quantity is available
      if (productVariant.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for variant of product ID ${productVariant.productId}` });
      }

      // Fetch the associated product to get the price
      const product = await Product.findById(productVariant.productId); // Fetch the product using productId from the variant
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found` });
      }

      // Prepare order item details
      orderItems.push({
        productId: productVariant.productId, // Reference to the product
        quantity: item.quantity,
        price: product.price // Get the price from the Product model
      });
    }

    // Create the order
    const order = await Order.create({
      userId: userId, // Use the user ID from the token
      total: cart.totalAmount, // Use the total amount from the cart
      status: 'Pending', // Set status as Pending
      shippingAddress: req.body.shippingAddress // Assuming you pass shipping address in the request body
    });

    // Create order products
    const orderProductPromises = orderItems.map(item => {
      return OrderProduct.create({
        orderId: order._id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price // Store the price from the Product model
      });
    });

    await Promise.all(orderProductPromises); // Wait for all order products to be created

    // Update product variant stock after the order is created
    for (const item of cart.items) {
      await ProductVariant.findByIdAndUpdate(item.productVariant, {
        $inc: { quantity: -item.quantity } // Decrease the quantity in the ProductVariant
      });
    }

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
 * /orders:
 *   get:
 *     summary: Get all orders in the database
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: List of all orders
 *       500:
 *         description: Internal server error
 */
export const getAllOrders = async (req, res) => {
  try {
    // Fetch all orders, selecting only the required fields including status
    const orders = await Order.find({}, 'orderDate total status shippingAddress'); // Select orderDate, total, status, and shippingAddress

    // Map the orders to include only the required fields
    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      orderDate: order.orderDate,
      total: order.total,
      status: order.status, // Include status in the response
      shippingAddress: order.shippingAddress // Include shipping address if needed
    }));

    res.status(200).json({ success: true, orders: formattedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /orders/id/{id}:
 *   get:
 *     summary: Get an order by order ID
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
    const { id } = req.params; // Get order ID from the URL parameters

    // Find the order by ID
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Query all OrderProducts associated with the orderId
    const orderProducts = await OrderProduct.find({ orderId: order._id })
      .populate({
        path: 'productId', // Populate the productId in OrderProduct to get product details
        select: 'title price', // Select only the fields you need from the Product model
      });

    // Format the order details to include necessary information
    const orderDetails = {
      orderId: order._id,
      orderDate: order.orderDate,
      total: order.total,
      status: order.status,
      shippingAddress: order.shippingAddress,
      items: orderProducts.map(item => ({
        productId: item.productId._id, // Include product ID
        productName: item.productId.title, // Get the product title
        quantity: item.quantity,
        price: item.price,
      })),
    };

    res.status(200).json({ success: true, order: orderDetails });
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