import {Product} from "../models/product.model.js";
import {Category} from "../models/category.model.js";

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