// backend/src/services/wallet.service.ts
import { ethers } from "ethers";
import mongoose from "mongoose";
import Wallet from "../models/wallet.model";
import vaultService from "./vault.service";
import { tokenList } from "../config/tokens";
import cacheService from "./cache.service";
import "dotenv/config";

// Initialize Ethereum provider
const provider = new ethers.JsonRpcProvider(
  `https://${process.env.NETWORK || "mainnet"}.infura.io/v3/${
    process.env.INFURA_API_KEY
  }`
);

console.log(
  "Provider initialized for network:",
  process.env.NETWORK || "mainnet"
);

class WalletService {
  // Generate a new wallet
  async generateWallet(
    userId: string,
    name?: string
  ): Promise<{ address: string }> {
    try {
      // Generate a random wallet
      const wallet = ethers.Wallet.createRandom();
      console.log("Generated new wallet address:", wallet.address);

      // Store private key in Vault
      const keyPath = await vaultService.storePrivateKey(
        userId,
        wallet.privateKey
      );

      // Create wallet record in database
      const newWallet = new Wallet({
        userId: new mongoose.Types.ObjectId(userId),
        address: wallet.address,
        vaultKeyPath: keyPath,
        name: name || "My Wallet",
      });

      await newWallet.save();
      console.log("Wallet saved to database");

      return {
        address: wallet.address,
      };
    } catch (error) {
      console.error("Error generating wallet:", error);
      throw new Error("Failed to generate wallet");
    }
  }

  // Get wallet by address for a specific user
  async getWallet(userId: string, walletAddress: string) {
    try {
      return await Wallet.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        address: walletAddress,
      });
    } catch (error) {
      throw new Error("Failed to retrieve wallet");
    }
  }

  // Get all wallets for a user
  async getUserWallets(userId: string) {
    try {
      return await Wallet.find({
        userId: new mongoose.Types.ObjectId(userId),
      });
    } catch (error) {
      throw new Error("Failed to retrieve user wallets");
    }
  }

  // Get token balances for a wallet with improved caching and error handling
  async getTokenBalances(walletAddress: string) {
    try {
      // Use caching to improve performance
      const cacheKey = `balances:${walletAddress}`;
      const cachedBalances = cacheService.get<any[]>(cacheKey);

      if (cachedBalances) {
        return cachedBalances;
      }

      const balances = [];

      // Get ETH balance with proper error handling
      try {
        const ethBalance = await provider.getBalance(walletAddress);
        balances.push({
          symbol: "ETH",
          name: "Ethereum",
          balance: ethers.formatEther(ethBalance),
          address: null,
          decimals: 18,
        });
      } catch (error) {
        console.error("Error fetching ETH balance:", error);
        balances.push({
          symbol: "ETH",
          name: "Ethereum",
          balance: "0",
          address: null,
          decimals: 18,
          error: "Failed to fetch balance",
        });
      }

      // Get ERC-20 token balances with concurrent requests
      const tokenPromises = tokenList
        .filter((token) => token.symbol !== "ETH" && token.address)
        .map(async (token) => {
          try {
            // For testing, just add token with 0 balance
            if (
              process.env.NODE_ENV === "test" ||
              !process.env.INFURA_API_KEY
            ) {
              return {
                symbol: token.symbol,
                name: token.name,
                balance: "0",
                address: token.address,
                decimals: token.decimals,
              };
            }

            // Create ERC-20 contract interface
            const contract = new ethers.Contract(
              token.address!,
              [
                "function balanceOf(address owner) view returns (uint256)",
                "function decimals() view returns (uint8)",
              ],
              provider
            );

            // Get balance and decimals concurrently
            const [balance, decimals] = await Promise.all([
              contract.balanceOf(walletAddress),
              token.decimals || contract.decimals(),
            ]);

            return {
              symbol: token.symbol,
              name: token.name,
              balance: ethers.formatUnits(balance, decimals),
              address: token.address,
              decimals,
            };
          } catch (err) {
            console.error(`Error fetching balance for ${token.symbol}:`, err);
            return {
              symbol: token.symbol,
              name: token.name,
              balance: "0",
              address: token.address,
              decimals: token.decimals,
              error: "Failed to fetch balance",
            };
          }
        });

      // Wait for all token balances to be fetched
      const tokenBalances = await Promise.all(tokenPromises);
      balances.push(...tokenBalances);

      // Cache results for 2 minutes
      cacheService.set(cacheKey, balances, 120);

      return balances;
    } catch (error) {
      console.error("Error getting token balances:", error);
      throw new Error("Failed to get token balances");
    }
  }

  // Estimate gas for token transfer
  async estimateGasForTransfer(
    fromAddress: string,
    toAddress: string,
    amount: string,
    tokenAddress: string | null,
    speedOption: "slow" | "standard" | "fast" = "standard"
  ) {
    try {
      let gasEstimate;
      let gasPrice;
      let maxFeePerGas;
      let maxPriorityFeePerGas;

      const safetyMargins = {
        slow: 110, // 10% buffer
        standard: 120, // 20% buffer
        fast: 140, // 40% buffer
      };

      // Get current fee data for EIP-1559 transactions
      const feeData = await provider.getFeeData();

      // Check if we're on an EIP-1559 enabled network
      const supportsEIP1559 =
        feeData.maxFeePerGas && feeData.maxPriorityFeePerGas;

      // The speed multipliers
      const speedMultipliers = {
        slow: 80, // 80% of base
        standard: 100, // 100% of base
        fast: 130, // 130% of base
      };

      if (tokenAddress) {
        // ERC-20 token transfer
        const erc20Abi = [
          "function transfer(address to, uint amount) returns (bool)",
          "function decimals() view returns (uint8)",
        ];

        const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
        const decimals = await contract.decimals();
        const parsedAmount = ethers.parseUnits(amount, decimals);

        // Estimate gas needed for token transfer
        gasEstimate = await contract.transfer.estimateGas(
          toAddress,
          parsedAmount,
          {
            from: fromAddress,
          }
        );
      } else {
        // ETH transfer
        gasEstimate = await provider.estimateGas({
          from: fromAddress,
          to: toAddress,
          value: ethers.parseEther(amount),
        });
      }

      // Add safety margin based on speed option
      gasEstimate =
        (gasEstimate * BigInt(safetyMargins[speedOption])) / BigInt(100);

      if (supportsEIP1559) {
        // For EIP-1559 transactions
        maxFeePerGas =
          (feeData.maxFeePerGas! * BigInt(speedMultipliers[speedOption])) /
          BigInt(100);
        maxPriorityFeePerGas =
          (feeData.maxPriorityFeePerGas! *
            BigInt(speedMultipliers[speedOption])) /
          BigInt(100);

        // Fallback gas price for legacy transactions
        gasPrice =
          (feeData.gasPrice! * BigInt(speedMultipliers[speedOption])) /
          BigInt(100);

        // Calculate cost in ETH
        const txFee = gasEstimate * maxFeePerGas;
        const formattedFee = ethers.formatEther(txFee);

        return {
          gasEstimate: gasEstimate.toString(),
          gasPrice: gasPrice.toString(),
          maxFeePerGas: maxFeePerGas.toString(),
          maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
          estimatedFeeETH: formattedFee,
          supportsEIP1559: true,
        };
      } else {
        // For legacy transactions
        gasPrice =
          (feeData.gasPrice! * BigInt(speedMultipliers[speedOption])) /
          BigInt(100);

        // Calculate cost in ETH
        const txFee = gasEstimate * gasPrice;
        const formattedFee = ethers.formatEther(txFee);

        return {
          gasEstimate: gasEstimate.toString(),
          gasPrice: gasPrice.toString(),
          estimatedFeeETH: formattedFee,
          supportsEIP1559: false,
        };
      }
    } catch (error: any) {
      console.error("Error estimating gas:", error);
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  // Send tokens from a wallet with improved gas estimation
  async sendToken(
    userId: string,
    walletAddress: string,
    toAddress: string,
    amount: string,
    tokenAddress: string | null,
    gasOptions?: {
      gasLimit?: string;
      gasPrice?: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
    }
  ) {
    try {
      // Get wallet from database
      const wallet = await Wallet.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        address: walletAddress,
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Get private key from Vault
      const privateKey = await vaultService.getPrivateKey(wallet.vaultKeyPath);

      // Create wallet instance
      const walletInstance = new ethers.Wallet(privateKey, provider);

      // Estimate gas if not provided
      let gasLimit;
      let gasPrice;
      let maxFeePerGas;
      let maxPriorityFeePerGas;

      if (!gasOptions || Object.keys(gasOptions).length === 0) {
        const gasEstimation = await this.estimateGasForTransfer(
          walletAddress,
          toAddress,
          amount,
          tokenAddress,
          "standard"
        );

        gasLimit = BigInt(gasEstimation.gasEstimate);

        if (gasEstimation.supportsEIP1559) {
          maxFeePerGas = BigInt(gasEstimation.maxFeePerGas!);
          maxPriorityFeePerGas = BigInt(gasEstimation.maxPriorityFeePerGas!);
        } else {
          gasPrice = BigInt(gasEstimation.gasPrice);
        }
      } else {
        gasLimit = gasOptions.gasLimit
          ? BigInt(gasOptions.gasLimit)
          : undefined;
        gasPrice = gasOptions.gasPrice
          ? BigInt(gasOptions.gasPrice)
          : undefined;
        maxFeePerGas = gasOptions.maxFeePerGas
          ? BigInt(gasOptions.maxFeePerGas)
          : undefined;
        maxPriorityFeePerGas = gasOptions.maxPriorityFeePerGas
          ? BigInt(gasOptions.maxPriorityFeePerGas)
          : undefined;
      }

      let tx;

      // Send ETH or ERC-20 token
      if (!tokenAddress) {
        // Sending ETH
        const txRequest: any = {
          to: toAddress,
          value: ethers.parseEther(amount),
        };

        // Add gas parameters
        if (gasLimit) txRequest.gasLimit = gasLimit;

        if (maxFeePerGas && maxPriorityFeePerGas) {
          txRequest.maxFeePerGas = maxFeePerGas;
          txRequest.maxPriorityFeePerGas = maxPriorityFeePerGas;
        } else if (gasPrice) {
          txRequest.gasPrice = gasPrice;
        }

        tx = await walletInstance.sendTransaction(txRequest);
      } else {
        // Sending ERC-20 token
        const erc20Abi = [
          "function transfer(address to, uint amount) returns (bool)",
          "function decimals() view returns (uint8)",
        ];

        const contract = new ethers.Contract(
          tokenAddress,
          erc20Abi,
          walletInstance
        );

        const decimals = await contract.decimals();
        const parsedAmount = ethers.parseUnits(amount, decimals);

        // Prepare transaction options
        const txOptions: any = {};
        if (gasLimit) txOptions.gasLimit = gasLimit;

        if (maxFeePerGas && maxPriorityFeePerGas) {
          txOptions.maxFeePerGas = maxFeePerGas;
          txOptions.maxPriorityFeePerGas = maxPriorityFeePerGas;
        } else if (gasPrice) {
          txOptions.gasPrice = gasPrice;
        }

        tx = await contract.transfer(toAddress, parsedAmount, txOptions);
      }

      console.log(`Transaction sent with hash: ${tx.hash}`);

      // Return transaction details without waiting for confirmation
      // This allows for a faster response to the client
      return {
        transactionHash: tx.hash,
        from: walletAddress,
        to: toAddress,
        amount,
        tokenAddress,
        status: "pending",
        gasLimit: gasLimit?.toString(),
        gasPrice: gasPrice?.toString(),
        maxFeePerGas: maxFeePerGas?.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
      };
    } catch (error: any) {
      console.error("Error sending token:", error);
      throw new Error(`Failed to send token: ${error.message}`);
    }
  }
}

export default new WalletService();
