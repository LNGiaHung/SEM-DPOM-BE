import { Supplier } from "../models/supplier.model.js";

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Supplier]
 *     responses:
 *       200:
 *         description: List of suppliers
 *       500:
 *         description: Internal server error
 */
export async function getAllSuppliers(req, res) {
    try {
        const suppliers = await Supplier.find();
        res.status(200).json({ success: true, suppliers });
    } catch (error) {
        console.log("Error in getAllSuppliers controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

/**
 * @swagger
 * /suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Supplier]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Supplier Name
 *               address:
 *                 type: string
 *                 example: Supplier Address
 *               phone:
 *                 type: string
 *                 example: 123-456-7890
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
export async function createSupplier(req, res) {
    try {
        const { name, address, phone } = req.body;

        if (!name || !address || !phone) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const newSupplier = new Supplier({ name, address, phone });
        await newSupplier.save();

        res.status(201).json({ success: true, supplier: newSupplier });
    } catch (error) {
        console.log("Error in createSupplier controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
} 