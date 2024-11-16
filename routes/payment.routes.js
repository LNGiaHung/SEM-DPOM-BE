import express from 'express';
import { getAllPayments, createPayment } from '../controllers/payment.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Payment management
 */

router.get('/', getAllPayments);
router.post('/', createPayment);

export default router; 