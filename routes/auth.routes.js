import express from "express";
import { authCheck, login, logout, signup, refreshToken } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", protectRoute, logout);

router.get("/authCheck", protectRoute, authCheck);

export default router;
