import api from "./api";
import type {
  Wallet,
  TokenBalance,
  GasEstimation,
  SendTokenParams,
  TransactionReceipt,
} from "../types/wallet.types";

const WalletService = {
  // Generate a new wallet
  async generateWallet(name?: string): Promise<{ address: string }> {
    const response = await api.post("/wallet/generate", { name });
    return response.data;
  },

  // Get all wallets for the current user
  async getUserWallets(): Promise<Wallet[]> {
    const response = await api.get("/wallet");
    return response.data;
  },

  // Get wallet by address
  async getWallet(address: string): Promise<Wallet> {
    const response = await api.get(`/wallet/${address}`);
    return response.data;
  },

  // Get token balances for a wallet
  async getTokenBalances(address: string): Promise<TokenBalance[]> {
    const response = await api.get(`/wallet/${address}/balances`);
    return response.data;
  },

  // Estimate gas for a token transfer
  async estimateGas(
    address: string,
    toAddress: string,
    amount: string,
    tokenAddress?: string | null,
    speedOption: "slow" | "standard" | "fast" = "standard"
  ): Promise<GasEstimation> {
    const response = await api.post(`/wallet/${address}/estimate-gas`, {
      toAddress,
      amount,
      tokenAddress,
      speedOption,
    });
    return response.data;
  },

  // Send tokens from a wallet
  async sendToken(
    address: string,
    params: SendTokenParams
  ): Promise<TransactionReceipt> {
    const response = await api.post(`/wallet/${address}/send`, params);
    return response.data;
  },

  // Approve token for Permit2 (required for swaps)
  async approveTokenForPermit2(
    address: string,
    tokenAddress: string
  ): Promise<TransactionReceipt> {
    const response = await api.post(`/wallet/${address}/approve-permit2`, {
      tokenAddress,
    });
    return response.data;
  },
};

export default WalletService;
