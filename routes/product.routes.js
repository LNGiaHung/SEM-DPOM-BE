import express from 'express';
import {
  getAllProducts,
  createProduct,
  getProductInventory,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  recommendProducts,
  getProductVariantsByProductId,
  calculateTotalStock,
  restockVariant,
  initializeProducts,
  getTopSellingProducts
} from '../controllers/product.controller.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product management
 */

// Public routes
router.get('/', getAllProducts);
router.get('/search', getProducts);
router.get('/id/:id', getProductById);
router.post('/recommend', recommendProducts);

// Protected routes (require authentication)
router.post('/', protectRoute, createProduct);
router.get('/inventory', protectRoute, getProductInventory);
router.put('/id/:id', protectRoute, updateProduct);
router.delete('/:id', protectRoute, deleteProduct);
router.get('/variants/:id', protectRoute, getProductVariantsByProductId);
router.post('/calculate-stock', protectRoute, calculateTotalStock);
router.post('/variants/restock', protectRoute, restockVariant);
router.post('/init', protectRoute, initializeProducts);
router.get('/top-selling', protectRoute, getTopSellingProducts);

export default router; 