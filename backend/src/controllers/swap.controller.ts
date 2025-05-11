// backend/src/controllers/swap.controller.ts
import { Request, Response } from "express";
import swapService from "../services/swap.service";

class SwapController {
  // Get price info (lightweight, no commitment)
  async getPrice(req: Request, res: Response) {
    try {
      const { sellToken, buyToken, sellAmount, takerAddress } = req.query;

      if (!sellToken || !buyToken || !sellAmount || !takerAddress) {
        res.status(400).json({
          message:
            "Sell token, buy token, sell amount, and taker address are required",
        });
        return;
      }

      const price = await swapService.getPrice(
        sellToken as string,
        buyToken as string,
        sellAmount as string,
        takerAddress as string
      );

      res.status(200).json(price);
    } catch (error: any) {
      console.error("Error getting price:", error);
      res.status(500).json({
        message: error.message || "Failed to get price",
      });
    }
  }

  // Get swap quote
  async getSwapQuote(req: Request, res: Response) {
    try {
      const {
        sellToken,
        buyToken,
        sellAmount,
        takerAddress,
        slippagePercentage,
      } = req.query;

      if (!sellToken || !buyToken || !sellAmount || !takerAddress) {
        res.status(400).json({
          message:
            "Sell token, buy token, sell amount, and taker address are required",
        });
        return;
      }

      const quote = await swapService.getSwapQuote(
        sellToken as string,
        buyToken as string,
        sellAmount as string,
        takerAddress as string,
        (slippagePercentage as string) || "0.01"
      );

      res.status(200).json(quote);
    } catch (error: any) {
      console.error("Error getting swap quote:", error);
      res.status(500).json({
        message: error.message || "Failed to get swap quote",
      });
    }
  }

  // Check token allowance for Permit2
  async checkTokenAllowance(req: Request, res: Response) {
    try {
      const { walletAddress, tokenAddress, amount } = req.query;

      if (!walletAddress || !tokenAddress || !amount) {
        res.status(400).json({
          message: "Wallet address, token address, and amount are required",
        });
        return;
      }

      const isApproved = await swapService.checkTokenAllowance(
        walletAddress as string,
        tokenAddress as string,
        amount as string
      );

      res.status(200).json({ approved: isApproved });
    } catch (error: any) {
      console.error("Error checking token allowance:", error);
      res.status(500).json({
        message: error.message || "Failed to check token allowance",
      });
    }
  }

  // Execute swap
  async executeSwap(req: Request, res: Response) {
    try {
      const userId = req.userId as string;
      const { walletAddress, quote } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!walletAddress || !quote) {
        res.status(400).json({
          message: "Wallet address and quote are required",
        });
        return;
      }

      const result = await swapService.executeSwap(
        userId,
        walletAddress,
        quote
      );

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error executing swap:", error);
      res.status(500).json({
        message: error.message || "Failed to execute swap",
      });
    }
  }
}

export default new SwapController();
