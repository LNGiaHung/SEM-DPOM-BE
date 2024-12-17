import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"; // Import jwt for token verification
import { ENV_VARS } from "../config/envVars.js"; // Import environment variables
import mongoose from "mongoose";
import bcrypt from 'bcrypt'; // Import bcrypt

// Get all staff users
/**
 * @swagger
 * /users/staff:
 *   get:
 *     summary: Get all staff users
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userID:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phoneNumber:
 *                         type: string
 *                       gender:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
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
    if (_id && typeof _id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Create a new user with the provided _id or let MongoDB generate one
    const newUser = new User({ 
      _id: _id || undefined, // Use provided _id or let MongoDB generate one
      username, 
      role, 
      password: hashedPassword, // Store the hashed password
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

// Get current logged-in user information
/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current logged-in user information
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Current user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     userID:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     gender:
 *                       type: string
 *       401:
 *         description: Unauthorized - No Token Provided or Invalid Token
 *       500:
 *         description: Internal server error
 */
export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);
    const userId = decoded.userId; // Get user ID from the decoded token

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { password, ...userWithoutPassword } = user._doc; // Exclude password from response

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error in getCurrentUser controller:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// Update current logged-in user information
/**
 * @swagger
 * /users/update:
 *   put:
 *     summary: Update user information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               gender:
 *                 type: string
 *               address:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       401:
 *         description: Unauthorized - No Token Provided
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
export const updateUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);
    const userId = decoded.userId; // Get user ID from the decoded token

    // Get the fields to update from the request body
    const updates = req.body;

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { password, ...userWithoutPassword } = updatedUser._doc; // Exclude password from response

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error in updateCurrentUser controller:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 role:
 *                   type: string
 *                 gender:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /users/update/{id}:
 *   put:
 *     summary: Update user information by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               gender:
 *                 type: string
 *               address:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       400:
 *         description: No fields to update
 *       401:
 *         description: Unauthorized - No Token Provided
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
export const updateUserById = async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from the URL parameters
    const updates = req.body; // Get the fields to update from the request body

    // Validate the request body
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Exclude sensitive information like password from the response
    const { password, ...userWithoutPassword } = updatedUser._doc;

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error in updateUserById controller:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
