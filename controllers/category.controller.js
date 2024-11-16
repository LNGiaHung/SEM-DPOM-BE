import { Category } from "../models/category.model.js";

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: List of categories
 *       500:
 *         description: Internal server error
 */
export async function getAllCategories(req, res) {
    try {
        const categories = await Category.find();
        res.status(200).json({ success: true, categories });
    } catch (error) {
        console.log("Error in getAllCategories controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
export async function createCategory(req, res) {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const newCategory = new Category({ name });
        await newCategory.save();

        res.status(201).json({ success: true, category: newCategory });
    } catch (error) {
        console.log("Error in createCategory controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
} 