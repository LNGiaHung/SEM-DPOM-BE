import { Product } from "../models/product.model.js";
import { getRecommendedProducts } from '../services/recommendation.service.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ProductVariant } from "../models/productVariant.model.js";
import { Category } from "../models/category.model.js";
import cloudinary, { validateCloudinaryConnection } from '../config/cloudinary.js';
import { Order } from "../models/order.model.js";
import { OrderProduct } from "../models/orderProduct.model.js";

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
 * /products/variants/restock:
 *   post:
 *     summary: Restock a product variant (Protected)
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
 *               - productId
 *               - size
 *               - color
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The ID of the product
 *               size:
 *                 type: string
 *                 description: The size of the product variant
 *               color:
 *                 type: string
 *                 description: The color of the product variant
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
 *         description: Invalid quantity - Quantity must be a positive number
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *       404:
 *         description: Variant not found - The specified variant ID does not exist
 *       500:
 *         description: Internal server error
 */
export const restockVariant = async (req, res) => {
  try {
    const { productId, size, color, quantity } = req.body;

    if (!productId || !size || !color || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid productId, size, color, and quantity greater than 0'
      });
    }

    const variant = await ProductVariant.findOne({ productId, size, color });
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    variant.quantity += quantity;
    await variant.save();

    const product = await Product.findById(productId);
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

/**
 * @swagger
 * /products/init:
 *   post:
 *     summary: Initialize categories and products with variants (Protected)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products and categories initialized successfully
 *       500:
 *         description: Internal server error
 */

// Fetch product images dynamically from Cloudinary
const fetchProductImages = async () => {
  const productImages = {};
  const productFolders = {
    'Backpack': 'Clothing/Accessories/Backpack',
    'Belt': 'Clothing/Accessories/Belt',
    'Handbag': 'Clothing/Accessories/Handbag',
    'Hat': 'Clothing/Accessories/Hat',
    'Scarf': 'Clothing/Accessories/Scarf',
    'Sunglasses': 'Clothing/Accessories/Sunglasses',
    'Blouse': 'Clothing/Clothing/Blouse',
    'Dress': 'Clothing/Clothing/Dress',
    'Hoodie': 'Clothing/Clothing/Hoodie',
    'Jeans': 'Clothing/Clothing/Jeans',
    'Pants': 'Clothing/Clothing/Pants',
    'Shirt': 'Clothing/Clothing/Shirt',
    'Shorts': 'Clothing/Clothing/Shorts',
    'Skirt': 'Clothing/Clothing/Skirts',
    'Socks': 'Clothing/Clothing/Socks',
    'Sweater': 'Clothing/Clothing/Sweater',
    'T-shirt': 'Clothing/Clothing/T-shirt',
    'Boots': 'Clothing/Footwear/Boot',
    'Sandals': 'Clothing/Footwear/Sandals',
    'Shoes': 'Clothing/Footwear/Shoes',
    'Sneakers': 'Clothing/Footwear/Sneaker',
    'Coat': 'Clothing/Outerwear/Coat',
    'Gloves': 'Clothing/Outerwear/Gloves',
    'Jacket': 'Clothing/Outerwear/Jacket',
  };

  const defaultImage = 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/default/no-image.jpg';

  try {
    // First validate Cloudinary connection
    const isConnected = await validateCloudinaryConnection();
    if (!isConnected) {
      console.error('Failed to connect to Cloudinary. Using default images.');
      return Object.fromEntries(
        Object.keys(productFolders).map(key => [key, defaultImage])
      );
    }

    // Fetch images for each product
    for (const [productName, folderPath] of Object.entries(productFolders)) {
      try {
        // Search for images in the specific folder
        const result = await cloudinary.v2.search
          .expression(`folder:${folderPath}/*`)
          .sort_by('created_at', 'desc')
          .max_results(1)
          .execute();

        if (result && result.resources && result.resources.length > 0) {
          productImages[productName] = result.resources[0].secure_url;
          console.log(`Found image for ${productName}: ${result.resources[0].secure_url}`);
        } else {
          console.log(`No images found for ${productName} in folder ${folderPath}`);
          productImages[productName] = defaultImage;
        }
      } catch (folderError) {
        console.error(`Error fetching images for ${productName}:`, folderError.message);
        productImages[productName] = defaultImage;
      }
    }
  } catch (error) {
    console.error('Error in fetchProductImages:', error);
    // Return default images for all products if there's an error
    return Object.fromEntries(
      Object.keys(productFolders).map(key => [key, defaultImage])
    );
  }

  return productImages;
};

export const initializeProducts = async (req, res) => {
  try {
    // Step 1: Delete all existing data
    await ProductVariant.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Step 2: Initialize categories
    const categories = ["Accessories", "Clothing", "Footwear", "Outerwear"];
    const categoryDocs = await Promise.all(
      categories.map(name => Category.create({ name }))
    );

    // Step 3: Map categories to IDs
    const categoryMap = {};
    categoryDocs.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Step 4: Fetch images from Cloudinary
    const productImages = await fetchProductImages();

    // Step 5: Define product categories
    const productCategories = {
      'Backpack': 'Accessories',
      'Belt': 'Accessories',
      'Handbag': 'Accessories',
      'Hat': 'Accessories',
      'Scarf': 'Accessories',
      'Sunglasses': 'Accessories',
      'Blouse': 'Clothing',
      'Dress': 'Clothing',
      'Hoodie': 'Clothing',
      'Jeans': 'Clothing',
      'Pants': 'Clothing',
      'Shirt': 'Clothing',
      'Shorts': 'Clothing',
      'Skirt': 'Clothing',
      'Socks': 'Clothing',
      'Sweater': 'Clothing',
      'T-shirt': 'Clothing',
      'Boots': 'Footwear',
      'Sandals': 'Footwear',
      'Shoes': 'Footwear',
      'Sneakers': 'Footwear',
      'Coat': 'Outerwear',
      'Gloves': 'Outerwear',
      'Jacket': 'Outerwear'
    };

    const sizes = ['S', 'M', 'L', 'XL'];
    const colors = ['White', 'Black', 'Blue', 'Green', 'Red'];
    let productsCreated = 0;
    let variantsCreated = 0;

    const uniqueProducts = Object.keys(productCategories);

    // Step 6: Create products and variants
    for (const productName of uniqueProducts) {
      const category = productCategories[productName];
      const categoryId = categoryMap[category];

      if (!categoryId) {
        console.log(`Category not found for product: ${ productName }`);
        continue;
      }

      const product = new Product({
        title: productName,
        description: `A high-quality ${productName.toLowerCase()}`,
        price: Math.floor(Math.random() * (200 - 20) + 20) * 23000,
        categoryId,
        material: ['Cotton', 'Polyester', 'Leather', 'Wool', 'Denim'][Math.floor(Math.random() * 5)],
        totalStock: 0,
        rating: (Math.random() * (5 - 4) + 4).toFixed(1),
        image: productImages[productName] || 'https://example.com/images/default.png'
      });

      await product.save();
      productsCreated++;

      // Create product variants
      for (const size of sizes) {
        for (const color of colors) {
          const variant = new ProductVariant({
            productId: product._id,
            size,
            color,
            quantity: Math.floor(Math.random() * 50) + 10
          });

          await variant.save();
          variantsCreated++;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Categories, products, and variants initialized successfully',
      categoriesCreated: categories.length,
      productsCreated,
      variantsCreated
    });
  } catch (error) {
    console.error('Error initializing products:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing products',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /products/order/{orderId}:
 *   get:
 *     summary: Get order details with product information (Protected)
 *     tags: [Product]
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
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: object
 *                           quantity:
 *                             type: number
 *                           price:
 *                             type: number
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

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

    res.status(200).json({
      success: true,
      order
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
 * /products/top-selling:
 *   get:
 *     summary: Get top 3 selling products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top 3 selling products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getTopSellingProducts = async (req, res) => {
  try {
    // Aggregate pipeline to get top 3 selling products
    const topProducts = await OrderProduct.aggregate([
      // Group by productId and calculate sales metrics
      {
        $group: {
          _id: '$productId',
          quantitySold: { $sum: '$quantity' },
          revenue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      // Sort by quantity sold in descending order
      { $sort: { quantitySold: -1 } },
      // Get only top 3
      { $limit: 3 },
      // Lookup product details
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      // Unwind the product array
      { $unwind: '$product' },
      // Format the output
      {
        $project: {
          _id: 0,
          productName: '$product.title',
          quantitySold: 1,
          revenue: {
            $round: ['$revenue', 0] // Round to whole numbers
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      topProducts
    });
  } catch (error) {
    console.error('Error in getTopSellingProducts:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};