// backend/src/routes/swap.routes.ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import swapController from "../controllers/swap.controller";

const router = Router();

// Public swap routes (no auth required)
router.get("/price", swapController.getPrice);
router.get("/quote", swapController.getSwapQuote);
router.get("/check-allowance", swapController.checkTokenAllowance);

// Protected routes (auth required)
router.post("/execute", authMiddleware, swapController.executeSwap);

export default router;
