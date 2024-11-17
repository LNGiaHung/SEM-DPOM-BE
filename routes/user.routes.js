import express from "express";
import {
  updateUser,
  getStaffUsers,
  createUser,
  getCurrentUser
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

export default router; 