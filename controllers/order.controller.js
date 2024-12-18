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
    const orders = await Order.find({}, 'userId orderDate total status shippingAddress'); // Select orderDate, total, status, and shippingAddress

    // Map the orders to include only the required fields
    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      userId: order.userId,
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
 * /orders/id/{orderId}:
 *   get:
 *     summary: Get an order by order ID
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: orderId
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
    const { orderId } = req.params; // Get order ID from the URL parameters

    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Query all OrderProducts associated with the orderId
    const orderProducts = await OrderProduct.find({ orderId: order._id })
      .populate({
        path: 'productId', // Populate the productId in OrderProduct to get product details
        select: 'title price image', // Select only the fields you need from the Product model
      });

    // Format the order details to include necessary information
    const orderDetails = {
      orderId: order._id,
      userId: order.userId,
      orderDate: order.createdAt,
      total: order.total,
      status: order.status,
      shippingAddress: order.shippingAddress,
      items: orderProducts.map(item => ({
        productId: item.productId._id,
        productName: item.productId.title,
        productImage: item.productId.image,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    res.status(200).json({ success: true, order: orderDetails });
  } catch (error) {
    console.error('Error in getOrderById:', error.message);
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

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get detailed order information (Protected)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     total:
 *                       type: number
 *                     status:
 *                       type: string
 *                     shippingAddress:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               image:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                               rating:
 *                                 type: number
 *                           quantity:
 *                             type: number
 *                           price:
 *                             type: number
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *       403:
 *         description: Forbidden - User not authorized to view this order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id; // Get user ID from the authenticated request

    // Find the order and populate product details
    const order = await Order.findById(orderId)
      .populate({
        path: 'products',
        populate: {
          path: 'productId',
          model: 'Product',
          select: 'title description image price rating'
        }
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if the user is authorized to view this order
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order'
      });
    }

    // Calculate additional order statistics
    const orderStats = {
      totalItems: order.products.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      orderDate: order.createdAt,
      lastUpdated: order.updatedAt
    };

    res.status(200).json({
      success: true,
      order: {
        ...order.toObject(),
        stats: orderStats
      }
    });
  } catch (error) {
    console.error('Error in getOrderDetails:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /orders/user:
 *   get:
 *     summary: Get all orders for the authenticated user (Protected)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter orders by status (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User's orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       total:
 *                         type: number
 *                       status:
 *                         type: string
 *                       shippingAddress:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       products:
 *                         type: array
 *                         items:
 *                           type: object
 *                       stats:
 *                         type: object
 *                         properties:
 *                           totalItems:
 *                             type: number
 *                           subtotal:
 *                             type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalOrders:
 *                       type: integer
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *       500:
 *         description: Internal server error
 */
export const getUserOrders = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req); // Get user ID from the authenticated request
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId };
    if (status) {
      query.status = status;
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);

    // Find orders with pagination
    const orders = await Order.find(query)
      .populate({
        path: 'products',
        populate: {
          path: 'productId',
          model: 'Product',
          select: 'title image price'
        }
      })
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .skip(skip)
      .limit(parseInt(limit));

    // Process each order to include statistics
    const processedOrders = orders.map(order => {
      const orderObj = order.toObject();
      const stats = {
        totalItems: order.products.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };

      return {
        ...orderObj,
        stats
      };
    });

    res.status(200).json({
      success: true,
      orders: processedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders
      }
    });
  } catch (error) {
    console.error('Error in getUserOrders:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};