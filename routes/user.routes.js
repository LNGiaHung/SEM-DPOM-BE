import express from "express";
import {
  updateUser,
  getStaffUsers,
  createUser
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

export default router; 