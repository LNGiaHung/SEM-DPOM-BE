import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
// import reviewRoutes from "./routes/review.routes.js";
import cartRoutes from "./routes/cart.routes.js"; // Import the cart routes


import { ENV_VARS } from "./config/envVars.js";
import { connectDB } from "./config/db.js";
import { protectRoute } from "./middleware/protectRoute.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend's origin
  credentials: true // Allow credentials to be sent with requests
}));

const PORT = ENV_VARS.PORT;
const __dirname = path.resolve();

app.use(express.json()); // will allow us to parse req.body
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", protectRoute , orderRoutes);
app.use("/api/v1/payments", protectRoute, paymentRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
// app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/cart", protectRoute, cartRoutes); // Add the cart routes


if (ENV_VARS.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

setupSwagger(app);

app.listen(PORT, () => {
  console.log("Server started at http://localhost:" + PORT);
  console.log("Swagger API documentation available at: http://localhost:" + PORT + "/api-docs");
  connectDB();
});
