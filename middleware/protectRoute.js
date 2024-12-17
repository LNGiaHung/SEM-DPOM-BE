import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ENV_VARS } from "../config/envVars.js";

export const protectRoute = async (req, res, next) => {
	try {
		// Get the token from the Authorization header
		const authHeader = req.headers.authorization;
		const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

		if (!token || token == null) {
			return res.status(401).json({ success: false, message: "Unauthorized - No Token Provided" });
		}
		let decoded;
		try {
			decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);
		} catch (e) {
			return res.status(401).json({ success: false, message: "Unauthorized - Invalid Token" });
		}


		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		req.user = user;

		next();
	} catch (error) {
		console.log("Error in protectRoute middleware: ", error.message);
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};
