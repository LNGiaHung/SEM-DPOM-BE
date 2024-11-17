import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"; // Import jwt for token verification
import { ENV_VARS } from "../config/envVars.js"; // Import environment variables
import mongoose from "mongoose";

// Update user information
/**
 * @swagger
 * /users/update:
 *   put:
 *     summary: Update user information
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               image:
 *                 type: string
 *                 example: http://example.com/image.jpg
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: At least one field must be provided for update
 *       401:
 *         description: Unauthorized - No Token Provided or Invalid Token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export async function updateUser(req, res) {
  try {
    const token = req.cookies[COOKIE_ACCESS_TOKEN]; // Ensure this matches the cookie name

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized - Invalid Token" });
    }

    const userId = decoded.userId; // Get user ID from the decoded token

    const { firstName, lastName, image } = req.body;

    if (!firstName && !lastName && !image) {
      return res.status(400).json({ success: false, message: "At least one field must be provided for update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, image },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { password, ...userWithoutPassword } = updatedUser._doc;

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error in updateUser controller:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

// Get all staff users
/**
 * @swagger
 * /users/staff:
 *   get:
 *     summary: Get all staff users
 *     tags: [User]
 *     responses:
 *       200:
 *         description: List of staff users
 *       500:
 *         description: Internal server error
 */
export const getStaffUsers = async (req, res) => {
  try {
    const users = await User.find();
    const formattedUsers = users
      .filter(user => user.role.toLowerCase() === 'staff') // Convert role to lowercase and check
      .map(user => ({
        userID: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender: user.gender
      }));
    
    res.status(200).json({ success: true, users: formattedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new user
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               username:
 *                 type: string
 *                 example: johndoe
 *               role:
 *                 type: string
 *                 example: staff
 *               password:
 *                 type: string
 *                 example: securepassword
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               gender:
 *                 type: string
 *                 example: Male
 *               address:
 *                 type: string
 *                 example: 123 Main St
 *               phoneNumber:
 *                 type: string
 *                 example: 123-456-7890
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: All fields are required
 *       500:
 *         description: Internal server error
 */
export const createUser = async (req, res) => {
  try {
    const { _id, username, role, password, firstName, lastName, email, gender, address, phoneNumber } = req.body;

    // Check for required fields
    if (!username || !role || !password || !firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if the provided _id is valid (if provided)
    if (_id && !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Create a new user with the provided _id or let MongoDB generate one
    const newUser = new User({ 
      _id: _id || undefined, // Use provided _id or let MongoDB generate one
      username, 
      role, 
      password, 
      firstName, 
      lastName, 
      email, 
      gender, 
      address, 
      phoneNumber 
    });

    await newUser.save();
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};