import express from 'express';
import {
  getAllProducts,
  createProduct,
  getProductInventory,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  recommendProducts
} from '../controllers/product.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product management
 */

// Route to get all products
router.get('/', getAllProducts);

// Route to create a new product
router.post('/', createProduct);

// Route to get product inventory
router.get('/inventory', getProductInventory);

// Route to search products with pagination
router.get('/search', getProducts);

// Route to get a product by ID
router.get('/:id', getProductById);

// Route to update a product
router.put('/:id', updateProduct);

// Route to delete a product
router.delete('/:id', deleteProduct);

// Route to get recommended products
router.post('/recommend', recommendProducts);

export default router; 