// backend/src/services/swap.service.ts
import axios from "axios";
import { ethers } from "ethers";
import Wallet from "../models/wallet.model";
import vaultService from "./vault.service";
import mongoose from "mongoose";
import { tokenList } from "../config/tokens";
import "dotenv/config";
import qs from "qs";

// Initialize Ethereum provider
const provider = new ethers.JsonRpcProvider(
  `https://${process.env.NETWORK || "mainnet"}.infura.io/v3/${
    process.env.INFURA_API_KEY
  }`
);

// 0x API configuration
const ZERO_X_API_URL = "https://api.0x.org";
const ZERO_X_API_KEY = process.env.ZERO_X_API_KEY || "";

// Network to chainId mapping
const NETWORK_CHAIN_ID: Record<string, string> = {
  mainnet: "1",
  goerli: "5",
  sepolia: "11155111",
  arbitrum: "42161",
  polygon: "137",
  optimism: "10",
};

// Permit2 constants
const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

class SwapService {
  // Get token address by symbol
  private getTokenAddressBySymbol(symbol: string): string | null {
    // Special case for ETH since we need WETH address for 0x
    if (symbol === "ETH") {
      return "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"; // WETH address on mainnet
    }

    const token = tokenList.find((t) => t.symbol === symbol);
    return token ? token.address : null;
  }

  // Check if token is approved for Permit2
  async checkTokenAllowance(
    walletAddress: string,
    tokenAddress: string,
    amount: string
  ): Promise<boolean> {
    try {
      // Skip check for ETH/WETH
      if (tokenAddress === "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2") {
        return true;
      }

      const erc20Abi = [
        "function allowance(address owner, address spender) view returns (uint256)",
        "function decimals() view returns (uint8)",
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
      const decimals = await contract.decimals();
      const requiredAllowance = ethers.parseUnits(amount, decimals);
      const currentAllowance = await contract.allowance(
        walletAddress,
        PERMIT2_ADDRESS
      );

      return currentAllowance >= requiredAllowance;
    } catch (error) {
      console.error("Error checking token allowance:", error);
      return false;
    }
  }

  // Approve token for Permit2
  async approveTokenForPermit2(
    userId: string,
    walletAddress: string,
    tokenAddress: string
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

      // ERC-20 contract interface
      const erc20Abi = [
        "function approve(address spender, uint256 amount) returns (bool)",
      ];

      const contract = new ethers.Contract(
        tokenAddress,
        erc20Abi,
        walletInstance
      );

      // Approve max amount
      const maxUint256 = ethers.MaxUint256;
      const tx = await contract.approve(PERMIT2_ADDRESS, maxUint256);

      console.log(`Approval transaction sent with hash: ${tx.hash}`);

      // Wait for confirmation (optional)
      const receipt = await tx.wait();

      return {
        transactionHash: tx.hash,
        status: receipt.status === 1 ? "success" : "failed",
        from: walletAddress,
        to: tokenAddress,
        spender: PERMIT2_ADDRESS,
      };
    } catch (error: any) {
      console.error("Error approving token for Permit2:", error);
      throw new Error(`Failed to approve token: ${error.message}`);
    }
  }

  // Get indicative price quote (no transaction data)
  async getPrice(
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    takerAddress: string
  ) {
    try {
      // Get token addresses
      const sellTokenAddress = this.getTokenAddressBySymbol(sellToken);
      const buyTokenAddress = this.getTokenAddressBySymbol(buyToken);

      if (!sellTokenAddress || !buyTokenAddress) {
        throw new Error(
          `Unknown token: ${!sellTokenAddress ? sellToken : buyToken}`
        );
      }

      // Get token decimals for sell token
      const sellTokenInfo = tokenList.find((t) => t.symbol === sellToken);
      const sellTokenDecimals = sellTokenInfo?.decimals || 18;

      // Calculate sell amount in wei
      const sellAmountInWei = ethers
        .parseUnits(sellAmount, sellTokenDecimals)
        .toString();

      // Get chain ID based on network
      const network = process.env.NETWORK || "mainnet";
      const chainId =
        network in NETWORK_CHAIN_ID ? NETWORK_CHAIN_ID[network] : "1"; // Default to mainnet if not found

      // Prepare query parameters
      const params = {
        sellToken: sellTokenAddress,
        buyToken: buyTokenAddress,
        sellAmount: sellAmountInWei,
        takerAddress,
        chainId,
      };

      // Prepare headers
      const headers = {
        "0x-api-key": ZERO_X_API_KEY,
        "0x-version": "v2",
      };

      console.log(`Requesting 0x price with params:`, params);

      // Call the 0x API price endpoint (less strict than quote)
      const response = await axios.get(
        `${ZERO_X_API_URL}/swap/permit2/price?${qs.stringify(params)}`,
        { headers }
      );

      console.log("Successfully received price info from 0x API");

      return response.data;
    } catch (error: any) {
      console.error(
        "Error getting price info:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to get price info: ${
          error.response?.data?.reason || error.message
        }`
      );
    }
  }

  // Get swap quote from 0x API using Permit2 endpoint
  async getSwapQuote(
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    takerAddress: string,
    slippagePercentage: string = "0.01" // Default 1% slippage
  ) {
    try {
      // Get token addresses
      const sellTokenAddress = this.getTokenAddressBySymbol(sellToken);
      const buyTokenAddress = this.getTokenAddressBySymbol(buyToken);

      if (!sellTokenAddress || !buyTokenAddress) {
        throw new Error(
          `Unknown token: ${!sellTokenAddress ? sellToken : buyToken}`
        );
      }

      // Get token decimals for sell token
      const sellTokenInfo = tokenList.find((t) => t.symbol === sellToken);
      const sellTokenDecimals = sellTokenInfo?.decimals || 18;

      // Calculate sell amount in wei
      const sellAmountInWei = ethers
        .parseUnits(sellAmount, sellTokenDecimals)
        .toString();

      // Get chain ID based on network
      const network = process.env.NETWORK || "mainnet";
      const chainId =
        network in NETWORK_CHAIN_ID ? NETWORK_CHAIN_ID[network] : "1"; // Default to mainnet if not found

      // Prepare query parameters
      const params = {
        sellToken: sellTokenAddress,
        buyToken: buyTokenAddress,
        sellAmount: sellAmountInWei,
        taker: takerAddress,
        chainId,
        slippagePercentage,
      };

      // Prepare headers
      const headers = {
        "0x-api-key": ZERO_X_API_KEY,
        "0x-version": "v2",
      };

      console.log(`Requesting 0x quote with params:`, params);

      // Call the 0x API
      const response = await axios.get(
        `${ZERO_X_API_URL}/swap/permit2/quote?${qs.stringify(params)}`,
        { headers }
      );

      console.log("Successfully received swap quote from 0x API");

      // Check if token allowance is needed
      const needsAllowance = await this.checkTokenAllowance(
        takerAddress,
        sellTokenAddress,
        sellAmount
      );

      return {
        ...response.data,
        needsAllowance: !needsAllowance,
        // Add extra metadata for frontend
        sellTokenSymbol: sellToken,
        buyTokenSymbol: buyToken,
        sellTokenAddress: sellTokenAddress,
        buyTokenAddress: buyTokenAddress,
        sellAmount: sellAmount,
        validTo: Date.now() + 5 * 60 * 1000, // Quote valid for 5 minutes
      };
    } catch (error: any) {
      console.error(
        "Error getting swap quote:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to get swap quote: ${
          error.response?.data?.reason || error.message
        }`
      );
    }
  }

  // Execute swap using the quote from 0x API with Permit2
  async executeSwap(userId: string, walletAddress: string, quote: any) {
    try {
      // Validate quote hasn't expired
      if (quote.validTo && Date.now() > quote.validTo) {
        throw new Error("Quote has expired");
      }

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

      console.log("Executing swap transaction...");

      // Check if we need to sign a Permit2 message
      let txData = quote.data;

      if (quote.permit2?.eip712) {
        console.log("Signing Permit2 message...");

        // Sign the EIP-712 typed data
        const signature = await walletInstance.signTypedData(
          quote.permit2.eip712.domain,
          quote.permit2.eip712.types,
          quote.permit2.eip712.message
        );

        // Calculate signature length and append to data
        const signatureLength = ethers
          .zeroPadValue(ethers.toBeHex(ethers.dataLength(signature)), 32)
          .slice(2); // Remove '0x' prefix

        // Append signature length and signature to transaction data
        txData = quote.data + signatureLength + signature.slice(2); // Remove '0x' from signature
      }

      // Estimate gas
      const gasEstimate = await provider.estimateGas({
        from: walletAddress,
        to: quote.to,
        data: txData,
        value: quote.value ? ethers.parseUnits(quote.value, "wei") : BigInt(0),
      });

      // Add buffer to gas estimate (e.g., 20%)
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

      // Get current gas price information
      const feeData = await provider.getFeeData();

      // Create transaction object
      const txRequest: any = {
        to: quote.to,
        data: txData,
        value: quote.value ? ethers.parseUnits(quote.value, "wei") : BigInt(0),
        gasLimit,
      };

      // Use EIP-1559 if available, otherwise use legacy gas price
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        txRequest.maxFeePerGas = feeData.maxFeePerGas;
        txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      } else {
        txRequest.gasPrice = feeData.gasPrice;
      }

      // Send the transaction
      const tx = await walletInstance.sendTransaction(txRequest);

      console.log(`Transaction sent with hash: ${tx.hash}`);

      // Return transaction details
      return {
        transactionHash: tx.hash,
        from: walletAddress,
        to: quote.to,
        sellToken: quote.sellTokenAddress,
        buyToken: quote.buyTokenAddress,
        sellAmount: quote.sellAmount,
        buyAmount: quote.buyAmount,
        status: "pending",
        gasLimit: gasLimit.toString(),
        gasPrice: feeData.gasPrice?.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
      };
    } catch (error: any) {
      console.error("Error executing swap:", error);
      throw new Error(`Failed to execute swap: ${error.message}`);
    }
  }
}

export default new SwapService();
