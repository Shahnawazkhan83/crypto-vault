// backend/src/controllers/token.controller.ts
import { Request, Response } from "express";
import { tokenList } from "../config/tokens";

class TokenController {
  // Get all supported tokens
  getTokenList(req: Request, res: Response) {
    try {
      res.status(200).json(tokenList);
    } catch (error: any) {
      console.error("Error getting token list:", error);
      res.status(500).json({
        message: error.message || "Failed to get token list",
      });
    }
  }
}

export default new TokenController();
