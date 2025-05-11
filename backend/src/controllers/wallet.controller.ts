// backend/src/controllers/wallet.controller.ts
import { Request, Response } from "express";
import walletService from "../services/wallet.service";
import swapService from "../services/swap.service";

class WalletController {
  // Generate a new wallet
  async generateWallet(req: Request, res: Response) {
    try {
      const { name } = req.body;
      const userId = req.userId as string;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const wallet = await walletService.generateWallet(userId, name);

      res.status(201).json(wallet);
    } catch (error: any) {
      console.error("Error generating wallet:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to generate wallet" });
    }
  }

  // Get all wallets for a user
  async getUserWallets(req: Request, res: Response) {
    try {
      const userId = req.userId as string;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const wallets = await walletService.getUserWallets(userId);

      res.status(200).json(wallets);
    } catch (error: any) {
      console.error("Error getting user wallets:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to retrieve wallets" });
    }
  }

  // Get wallet by address
  async getWallet(req: Request, res: Response) {
    try {
      const userId = req.userId as string;
      const { address } = req.params;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!address) {
        res.status(400).json({ message: "Wallet address is required" });
        return;
      }

      const wallet = await walletService.getWallet(userId, address);

      if (!wallet) {
        res.status(404).json({ message: "Wallet not found" });
        return;
      }

      res.status(200).json(wallet);
    } catch (error: any) {
      console.error("Error getting wallet:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to retrieve wallet" });
    }
  }

  // Get token balances
  async getTokenBalances(req: Request, res: Response) {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({ message: "Wallet address is required" });
        return;
      }

      const balances = await walletService.getTokenBalances(address);

      res.status(200).json(balances);
    } catch (error: any) {
      console.error("Error getting token balances:", error);
      res.status(500).json({
        message: error.message || "Failed to retrieve token balances",
      });
    }
  }

  // Estimate gas for token transfer
  async estimateGas(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const { toAddress, amount, tokenAddress, speedOption } = req.body;

      if (!address || !toAddress || !amount) {
        res.status(400).json({
          message: "Wallet address, recipient address, and amount are required",
        });
        return;
      }

      const gasEstimation = await walletService.estimateGasForTransfer(
        address,
        toAddress,
        amount,
        tokenAddress || null,
        speedOption || "standard"
      );

      res.status(200).json(gasEstimation);
    } catch (error: any) {
      console.error("Error estimating gas:", error);
      res.status(500).json({
        message: error.message || "Failed to estimate gas",
      });
    }
  }

  // Send token
  async sendToken(req: Request, res: Response) {
    try {
      const userId = req.userId as string;
      const { address } = req.params;
      const { toAddress, amount, tokenAddress, gasOptions } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!address || !toAddress || !amount) {
        res.status(400).json({
          message: "Wallet address, recipient address, and amount are required",
        });
        return;
      }

      const transaction = await walletService.sendToken(
        userId,
        address,
        toAddress,
        amount,
        tokenAddress || null,
        gasOptions
      );

      res.status(200).json(transaction);
    } catch (error: any) {
      console.error("Error sending token:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to send token" });
    }
  }

  // Approve token for Permit2
  async approveTokenForPermit2(req: Request, res: Response) {
    try {
      const userId = req.userId as string;
      const { address } = req.params;
      const { tokenAddress } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!address || !tokenAddress) {
        res.status(400).json({
          message: "Wallet address and token address are required",
        });
        return;
      }

      const result = await swapService.approveTokenForPermit2(
        userId,
        address,
        tokenAddress
      );

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error approving token for Permit2:", error);
      res.status(500).json({
        message: error.message || "Failed to approve token",
      });
    }
  }
}

export default new WalletController();
