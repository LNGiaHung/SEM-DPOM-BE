import express from 'express';
import { getAllCategories, createCategory } from '../controllers/category.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Category management
 */

router.get('/', getAllCategories);
router.post('/', createCategory);

export default router; 