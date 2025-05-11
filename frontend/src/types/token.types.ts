export interface Token {
  symbol: string;
  name: string;
  address: string | null;
  decimals: number;
  logoURI?: string;
}

export interface SwapPrice {
  sellAmount: string;
  buyAmount: string;
  price: string;
  estimatedGas: string;
  estimatedGasPrice: string;
  sources: SwapSource[];
  sellTokenSymbol?: string;
  buyTokenSymbol?: string;
  sellTokenAddress?: string;
  buyTokenAddress?: string;
}

export interface SwapSource {
  name: string;
  proportion: string;
}

export interface SwapQuote {
  sellAmount: string;
  buyAmount: string;
  price: string;
  guaranteedPrice: string;
  sources: SwapSource[];
  to: string;
  data: string;
  value: string;
  gasPrice: string;
  gas: string;
  estimatedGas: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  permit2?: any;
  needsAllowance?: boolean;
  sellTokenSymbol: string;
  buyTokenSymbol: string;
  sellTokenAddress: string;
  buyTokenAddress: string;
  validTo: number;
}

export interface SwapExecutionResult {
  transactionHash: string;
  from: string;
  to: string;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  status: string;
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}
