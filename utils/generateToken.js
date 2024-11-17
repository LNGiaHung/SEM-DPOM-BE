import jwt from "jsonwebtoken";
import { ENV_VARS } from "../config/envVars.js";

export const generateAccessToken = (userId) => {
	return jwt.sign({ userId }, ENV_VARS.JWT_SECRET, { expiresIn: "1d" });
};

export const generateRefreshToken = (userId) => {
	return jwt.sign({ userId }, ENV_VARS.JWT_SECRET, { expiresIn: "15d" });
};

export const setRefreshTokenCookie = (refreshToken, res) => {
	res.cookie("refreshToken", refreshToken, { // Set the cookie name for the refresh token
		maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in MS
		httpOnly: true, // prevent XSS attacks
		sameSite: "None", // prevent CSRF attacks
		secure: ENV_VARS.NODE_ENV !== "development", // Use secure cookies in production
	});
};
