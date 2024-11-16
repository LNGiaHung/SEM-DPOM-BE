import { Review } from "../models/review.model.js";

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Review]
 *     responses:
 *       200:
 *         description: List of reviews
 *       500:
 *         description: Internal server error
 */
export async function getAllReviews(req, res) {
    try {
        const reviews = await Review.find();
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.log("Error in getAllReviews controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Review]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8e8
 *               product:
 *                 type: string
 *                 example: 60d5ec49f1b2c8b1f8c8e8e8
 *               rating:
 *                 type: number
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: Great product!
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
export async function createReview(req, res) {
    try {
        const { user, product, rating, comment } = req.body;

        if (!user || !product || !rating || !comment) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const newReview = new Review({ user, product, rating, comment });
        await newReview.save();

        res.status(201).json({ success: true, review: newReview });
    } catch (error) {
        console.log("Error in createReview controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
} 