import {Product} from "../models/product.model.js";
import {Category} from "../models/category.model.js";
import { getRecommendedProducts } from '../services/recommendation.service.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ENV_VARS } from '../config/envVars.js'; // Import environment variables

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: List of products
 *       500:
 *         description: Internal server error
 */
export async function getAllProducts(req, res) {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.log("Error in getAllProducts controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Product Title
 *               description:
 *                 type: string
 *                 example: Product Description
 *               price:
 *                 type: number
 *                 example: 99.99
 *               categoryId:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8e8
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
export async function createProduct(req, res) {
  try {
    const { title, description, price, categoryId } = req.body;

    if (!title || !description || !price || !categoryId) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newProduct = new Product({ title, description, price, categoryId });
    await newProduct.save();

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * @swagger
 * /products/inventory:
 *   get:
 *     summary: Get product inventory
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: List of products with inventory details
 *       500:
 *         description: Internal server error
 */
export const getProductInventory = async (req, res) => {
  try {
    const products = await Product.find().populate('categoryId', 'name');
    const formattedProducts = products.map(product => ({
      name: product.title,
      category: product.categoryId.name,
      quantity: product.quantity
    }));
    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Get products with pagination and search
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products with pagination
 *       500:
 *         description: Internal server error
 */
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('categoryId');

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Product Title
 *               description:
 *                 type: string
 *                 example: Updated Product Description
 *               price:
 *                 type: number
 *                 example: 89.99
 *               categoryId:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8e8
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

// Load product names from product.json
const loadProducts = () => {
  const filePath = join(__dirname, '../product.json'); // Adjust the path as necessary
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
};

// Function to find the most similar product
const findMostSimilarProduct = (productName, products) => {
  return products.find(product => product.toLowerCase().includes(productName.toLowerCase())) || null;
};

/**
 * @swagger
 * /products/recommend:
 *   post:
 *     summary: Get recommended products based on a product name
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 example: "Sample Product"
 *     responses:
 *       200:
 *         description: List of recommended products
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
export const recommendProducts = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req); // Get user ID from token
    const { productName } = req.body;

    if (!productName) {
      return res.status(400).json({ message: 'Product name is required.' });
    }

    // Find the most similar product (this could be a database query as well)
    const similarProduct = await Product.findOne({ title: { $regex: productName, $options: 'i' } });

    if (!similarProduct) {
      return res.status(404).json({ message: 'No similar product found.' });
    }

    // Get recommendations based on the similar product
    const recommendations = await getRecommendedProducts(similarProduct.title, userId);

    // Extract product names from recommendations, ensuring they are defined
    const recommendedProductNames = recommendations
      .map(rec => rec.Item)
      .filter(item => item); // Filter out any undefined or null items

    // Load all products from the database
    const products = await Product.find();

    // Find similar products based on the recommended product names
    const similarProducts = products.filter(product => 
      recommendedProductNames.some(recName => 
        product.title && product.title.toLowerCase().includes(recName.toLowerCase())
      )
    );

    res.status(200).json({ recommendations, similarProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};