import express from 'express';
import { getAllReviews, createReview } from '../controllers/review.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Review
 *   description: Review management
 */

router.get('/', getAllReviews);
router.post('/', createReview);

export default router; 