import express from "express";
import {
  updateUser,
  getStaffUsers,
  createUser,
  getUserById,
  getCurrentUser
} from "../controllers/user.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management
 */

// Route to update user information
router.put("/update", updateUser);

// Route to get all staff users
router.get("/staff", getStaffUsers);

// Route to create a new user
router.post("/", createUser);

// Route to get user by ID
router.get("/:id", getUserById);

// Route to get current logged-in user information
router.get("/me", getCurrentUser);

export default router; 