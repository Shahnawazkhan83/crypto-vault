// backend/src/controllers/auth.controller.ts
import { Request, Response } from "express";
import authService from "../services/auth.service";

class AuthController {
  // Register a new user
  async register(req: Request, res: Response) {
    try {
      const { email, password, username } = req.body;

      // Validate input
      if (!email || !password || !username) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }

      // Register user
      const result = await authService.register(email, password, username);

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Login a user
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      // Login user
      const result = await authService.login(email, password);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  // Refresh access token
  async refreshToken(req: Request, res: Response) {
    try {
      const { userId, refreshToken } = req.body;

      // Validate input
      if (!userId || !refreshToken) {
        res
          .status(400)
          .json({ message: "User ID and refresh token are required" });
        return;
      }

      // Refresh token
      const result = await authService.refreshToken(userId, refreshToken);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  // Logout a user
  async logout(req: Request, res: Response) {
    try {
      const { userId, refreshToken } = req.body;

      // Validate input
      if (!userId || !refreshToken) {
        res
          .status(400)
          .json({ message: "User ID and refresh token are required" });
        return;
      }

      // Logout user
      await authService.logout(userId, refreshToken);

      res.status(200).json({ message: "Logged out successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export default new AuthController();
