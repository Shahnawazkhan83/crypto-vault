// backend/src/services/auth.service.ts
import jwt, { SignOptions } from "jsonwebtoken";
import User, { IUser } from "../models/user.model";
import tokenStorage from "./token-storage.service";
import crypto from "crypto";

// Enhanced token security
const TOKEN_VERSION = "v1"; // For future token invalidation

class AuthService {
  // Generate JWT tokens with enhanced security
  generateTokens(userId: string) {
    // Generate a random jti (JWT ID) for each token to prevent replay attacks
    const accessJti = crypto.randomBytes(16).toString("hex");
    const refreshJti = crypto.randomBytes(16).toString("hex");

    const accessToken = jwt.sign(
      {
        userId,
        jti: accessJti,
        version: TOKEN_VERSION,
      },
      process.env.JWT_SECRET || "access_secret",
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        audience: process.env.JWT_AUDIENCE || "crypto-wallet-api",
        issuer: process.env.JWT_ISSUER || "crypto-wallet-backend",
      } as SignOptions
    );

    const refreshToken = jwt.sign(
      {
        userId,
        jti: refreshJti,
        version: TOKEN_VERSION,
      },
      process.env.JWT_REFRESH_SECRET || "refresh_secret",
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
        audience: process.env.JWT_AUDIENCE || "crypto-wallet-api",
        issuer: process.env.JWT_ISSUER || "crypto-wallet-backend",
      } as SignOptions
    );

    // Store refresh token in memory with JTI
    const refreshExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
    tokenStorage.set(`refresh:${userId}:${refreshJti}`, "valid", refreshExpiry);

    return { accessToken, refreshToken, refreshJti };
  }

  // Register a new user
  async register(email: string, password: string, username: string) {
    try {
      // Input validation
      if (!email || !password || !username) {
        throw new Error("All fields are required");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error("Email already in use");
      }

      // Create new user
      const user = new User({
        email,
        password, // Password hashing is done in pre-save hook
        username,
      });

      await user.save();

      // Generate tokens
      const tokens = this.generateTokens(user.id.toString());

      return {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
        },
        ...tokens,
      };
    } catch (error) {
      throw error;
    }
  }

  // Login a user
  async login(email: string, password: string) {
    try {
      // Input validation
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      // Generate tokens
      const tokens = this.generateTokens(user.id.toString());

      return {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
        },
        ...tokens,
      };
    } catch (error) {
      throw error;
    }
  }

  // Refresh access token
  async refreshToken(userId: string, refreshToken: string) {
    try {
      // Verify refresh token JWT
      let decoded;
      try {
        decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET || "refresh_secret"
        ) as { userId: string; jti: string; version: string };
      } catch (error) {
        throw new Error("Invalid refresh token");
      }

      // Make sure the token belongs to the user
      if (decoded.userId !== userId) {
        throw new Error("Token does not match user");
      }

      // Check version (for future token invalidation)
      if (decoded.version !== TOKEN_VERSION) {
        throw new Error("Token version is outdated");
      }

      // Verify refresh token exists in storage
      const jti = decoded.jti;
      const isValid = await tokenStorage.get(`refresh:${userId}:${jti}`);

      if (!isValid) {
        throw new Error("Invalid refresh token");
      }

      // Delete used refresh token to prevent reuse
      await tokenStorage.del(`refresh:${userId}:${jti}`);

      // Generate new tokens
      const tokens = this.generateTokens(userId);

      return tokens;
    } catch (error) {
      throw error;
    }
  }

  // Logout a user
  async logout(userId: string, refreshToken: string) {
    try {
      // Verify refresh token to get JTI
      let decoded;
      try {
        decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET || "refresh_secret"
        ) as { userId: string; jti: string };
      } catch (error) {
        // Just continue even if token is invalid
        return true;
      }

      // Delete refresh token
      if (decoded && decoded.jti) {
        await tokenStorage.del(`refresh:${userId}:${decoded.jti}`);
      }

      return true;
    } catch (error) {
      console.error("Error during logout:", error);
      // Always return success for logout attempts
      return true;
    }
  }
}

export default new AuthService();
