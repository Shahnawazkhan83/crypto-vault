// backend/src/routes/wallet.routes.ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import walletController from "../controllers/wallet.controller";

const router = Router();

// Wallet routes with auth middleware applied to each route individually
router.post("/generate", authMiddleware, walletController.generateWallet);
router.get("/", authMiddleware, walletController.getUserWallets);
router.get("/:address", authMiddleware, walletController.getWallet);
router.get(
  "/:address/balances",
  authMiddleware,
  walletController.getTokenBalances
);
router.post("/:address/send", authMiddleware, walletController.sendToken);
router.post(
  "/:address/estimate-gas",
  authMiddleware,
  walletController.estimateGas
);
router.post(
  "/:address/approve-permit2",
  authMiddleware,
  walletController.approveTokenForPermit2
);

export default router;
