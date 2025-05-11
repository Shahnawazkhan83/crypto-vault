// backend/src/app.ts
import express, { Application } from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

import swaggerUi from "swagger-ui-express";
import * as fs from "fs";
import * as yaml from "js-yaml";

// Import routes
import authRoutes from "./routes/auth.routes";
import walletRoutes from "./routes/wallet.routes";
import tokenRoutes from "./routes/token.routes";
import swapRoutes from "./routes/swap.routes";

// Load environment variables - specify path to make sure it loads
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Initialize Express app
const app: Application = express();

// Get MongoDB URI with a definite fallback
const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/crypto-wallet";
console.log(`Attempting to connect to MongoDB at: ${mongoUri}`);

// Connect to MongoDB
mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load Swagger document with proper type assertion
const swaggerDocument = yaml.load(
  fs.readFileSync(path.join(__dirname, "../swagger.yaml"), "utf8")
) as swaggerUi.JsonObject;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Simple test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/swap", swapRoutes);

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
