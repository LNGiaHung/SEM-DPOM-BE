import express from "express";
import {
  updateUser,
  getStaffUsers,
  createUser,
  getCurrentUser,
  getUserById,
  deleteUser,
  updateUserById
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

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

// Route to get current logged-in user information
router.get("/me", protectRoute, getCurrentUser);

// Route to get user by ID
router.get("/:id", protectRoute, getUserById);

// Route to delete user
router.delete("/:id", protectRoute, deleteUser);

// Route to update user information
router.put('/:id', protectRoute, updateUserById);

export default router; 