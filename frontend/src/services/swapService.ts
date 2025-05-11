import api from "./api";
import type {
  SwapPrice,
  SwapQuote,
  SwapExecutionResult,
} from "../types/token.types";

const SwapService = {
  // Get price information for a swap (no commitment)
  async getPrice(
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    takerAddress: string
  ): Promise<SwapPrice> {
    const response = await api.get("/swap/price", {
      params: {
        sellToken,
        buyToken,
        sellAmount,
        takerAddress,
      },
    });
    return response.data;
  },

  // Get a swap quote (with transaction data)
  async getSwapQuote(
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    takerAddress: string,
    slippagePercentage: string = "0.01"
  ): Promise<SwapQuote> {
    const response = await api.get("/swap/quote", {
      params: {
        sellToken,
        buyToken,
        sellAmount,
        takerAddress,
        slippagePercentage,
      },
    });
    return response.data;
  },

  // Check if a token has allowance for Permit2
  async checkTokenAllowance(
    walletAddress: string,
    tokenAddress: string,
    amount: string
  ): Promise<{ approved: boolean }> {
    const response = await api.get("/swap/check-allowance", {
      params: {
        walletAddress,
        tokenAddress,
        amount,
      },
    });
    return response.data;
  },

  // Execute a swap
  async executeSwap(
    walletAddress: string,
    quote: SwapQuote
  ): Promise<SwapExecutionResult> {
    const response = await api.post("/swap/execute", {
      walletAddress,
      quote,
    });
    return response.data;
  },
};

export default SwapService;
