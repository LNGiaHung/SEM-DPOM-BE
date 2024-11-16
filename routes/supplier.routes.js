import express from 'express';
import { getAllSuppliers, createSupplier } from '../controllers/supplier.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Supplier
 *   description: Supplier management
 */

router.get('/', getAllSuppliers);
router.post('/', createSupplier);

export default router; 