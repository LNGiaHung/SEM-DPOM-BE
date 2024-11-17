import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
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
 * /cart/details:
 *   get:
 *     summary: Get the user's cart with product details
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart retrieved successfully with product details
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Internal server error
 */
export const getCartWithDetails = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req); // Get user ID from token
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Map cart items to include product details
    const cartDetails = await Promise.all(cart.items.map(async (item) => {
      const product = await Product.findById(item.product);
      return {
        productId: product._id,
        productName: product.title, // Assuming the product model has a 'name' field
        productPrice: product.price, // Assuming the product model has a 'price' field
        quantity: item.quantity,
      };
    }));

    res.json({ ...cart._doc, items: cartDetails }); // Return cart with detailed items
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get the user's cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Internal server error
 */
export const getCart = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req); // Get user ID from token
    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Add a product to the cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8e8
 *               quantity:
 *                 type: number
 *                 example: 2
 *     responses:
 *       200:
 *         description: Product added to cart successfully
 *       400:
 *         description: Product ID and quantity are required or insufficient stock
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export const addToCart = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req); // Get user ID from token
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    cart.totalAmount = await calculateTotal(cart.items);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /cart/item:
 *   put:
 *     summary: Update an item in the cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8e8
 *               quantity:
 *                 type: number
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       404:
 *         description: Cart or item not found
 *       500:
 *         description: Internal server error
 */
export const updateCartItem = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req); // Get user ID from token
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    cart.totalAmount = await calculateTotal(cart.items);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const calculateTotal = async (items) => {
  const productPromises = items.map(item => Product.findById(item.product));
  const products = await Promise.all(productPromises);

  return items.reduce((total, item, index) => {
    const product = products[index];
    return total + (product.price * item.quantity);
  }, 0);
};