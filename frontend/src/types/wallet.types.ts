export interface Wallet {
  _id: string;
  address: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  address: string | null;
  decimals: number;
  logoURI?: string;
  error?: string;
}

export interface TransactionReceipt {
  transactionHash: string;
  from: string;
  to: string;
  amount?: string;
  tokenAddress?: string | null;
  status: "pending" | "success" | "failed";
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface GasEstimation {
  gasEstimate: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedFeeETH: string;
  supportsEIP1559: boolean;
}

export interface SendTokenParams {
  toAddress: string;
  amount: string;
  tokenAddress?: string | null;
  gasOptions?: {
    gasLimit?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
}

export interface WalletState {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  balances: Record<string, TokenBalance[]>;
  isLoading: boolean;
  error: string | null;
}
