import {Product} from "../models/product.model.js";
import { getRecommendedProducts } from '../services/recommendation.service.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ENV_VARS } from '../config/envVars.js';
import { ProductVariant } from "../models/productVariant.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products (Public)
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       categoryId:
 *                         type: string
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
 *     summary: Create a new product (Protected)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - categoryId
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
 *       401:
 *         description: Unauthorized - No token provided or invalid token
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
 *     summary: Get product inventory (Protected)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products with inventory details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   category:
 *                     type: string
 *                   quantity:
 *                     type: number
 *       401:
 *         description: Unauthorized - No token provided or invalid token
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
 *     summary: Get products with pagination and search (Public)
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product title or description
 *     responses:
 *       200:
 *         description: List of products with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
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
 * /products/id/{id}:
 *   get:
 *     summary: Get a product by ID (Public)
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
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
 * /products/id/{id}:
 *   put:
 *     summary: Update a product (Protected)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Unauthorized - No token provided or invalid token
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
 *     summary: Delete a product (Protected)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized - No token provided or invalid token
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

/**
 * @swagger
 * /products/recommend:
 *   post:
 *     summary: Get recommended products based on a product name (Public)
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *             properties:
 *               productName:
 *                 type: string
 *                 example: "Sample Product"
 *     responses:
 *       200:
 *         description: List of recommended products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                 similarProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid input
 *       404:
 *         description: No similar product found
 *       500:
 *         description: Internal server error
 */
export const recommendProducts = async (req, res) => {
  try {
    const { productName } = req.body;

    if (!productName) {
      return res.status(400).json({ message: 'Product name is required.' });
    }

    const similarProduct = await Product.findOne({ title: { $regex: productName, $options: 'i' } });

    if (!similarProduct) {
      return res.status(404).json({ message: 'No similar product found.' });
    }

    const recommendations = await getRecommendedProducts(similarProduct.title);

    const recommendedProductNames = recommendations
      .map(rec => rec.Item)
      .filter(item => item);

    const products = await Product.find();

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

/**
 * @swagger
 * /products/variants/{id}:
 *   get:
 *     summary: Get all variants of a product by product ID (Protected)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of product variants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 variants:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export const getProductVariantsByProductId = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variants = await ProductVariant.find({ productId: id });

    res.status(200).json({ success: true, variants });
  } catch (error) {
    console.log("Error in getProductVariantsByProductId controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @swagger
 * /products/calculate-stock:
 *   post:
 *     summary: Calculate and update total stock for all products (Protected)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total stock calculated and updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *       500:
 *         description: Internal server error
 */
export const calculateTotalStock = async (req, res) => {
  try {
    const products = await Product.find();

    for (const product of products) {
      const variants = await ProductVariant.find({ productId: product._id });
      const totalStock = variants.reduce((total, variant) => total + variant.quantity, 0);
      product.totalStock = totalStock;
      await product.save();
    }

    res.status(200).json({ success: true, message: 'Total stock calculated and updated for all products.' });
  } catch (error) {
    console.error('Error calculating total stock:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @swagger
 * /products/variants/{variantId}/restock:
 *   post:
 *     summary: Restock a product variant (Protected)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product variant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: The quantity to add to current stock
 *                 example: 10
 *     responses:
 *       200:
 *         description: Variant restocked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 variant:
 *                   type: object
 *       400:
 *         description: Invalid quantity
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *       404:
 *         description: Variant not found
 *       500:
 *         description: Internal server error
 */
export const restockVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid quantity greater than 0' 
      });
    }

    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product variant not found' 
      });
    }

    variant.quantity += quantity;
    await variant.save();

    const product = await Product.findById(variant.productId);
    if (product) {
      const variants = await ProductVariant.find({ productId: product._id });
      const totalStock = variants.reduce((total, variant) => total + variant.quantity, 0);
      product.totalStock = totalStock;
      await product.save();
    }

    res.status(200).json({
      success: true,
      message: 'Variant restocked successfully',
      variant
    });
  } catch (error) {
    console.error('Error in restockVariant controller:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};