import { Payment } from "../models/payment.model.js";

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: List of payments
 *       500:
 *         description: Internal server error
 */
export async function getAllPayments(req, res) {
    try {
        const payments = await Payment.find();
        res.status(200).json({ success: true, payments });
    } catch (error) {
        console.log("Error in getAllPayments controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: payment_12345
 *               method:
 *                 type: string
 *                 example: Credit Card
 *               orderId:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8e8
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
export async function createPayment(req, res) {
    try {
        const { paymentId, method, orderId } = req.body;

        if (!paymentId || !method || !orderId) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const newPayment = new Payment({ paymentId, method, orderId });
        await newPayment.save();

        res.status(201).json({ success: true, payment: newPayment });
    } catch (error) {
        console.log("Error in createPayment controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
} 