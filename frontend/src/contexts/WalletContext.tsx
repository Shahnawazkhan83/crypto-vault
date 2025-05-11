import React, {
  createContext,
  useReducer,
  useEffect,
  useContext,
  useCallback,
} from "react";
import type {
  Wallet,
  TokenBalance,
  WalletState,
  SendTokenParams,
  TransactionReceipt,
  GasEstimation,
} from "../types/wallet.types";
import WalletService from "../services/walletService";
import TokenService from "../services/tokenService";
import type { Token } from "../types/token.types";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

// Define the wallet context type
interface WalletContextType {
  state: WalletState;
  tokens: Token[];
  loadWallets: () => Promise<void>;
  generateWallet: (name?: string) => Promise<string>;
  selectWallet: (wallet: Wallet) => void;
  refreshBalances: (address: string) => Promise<void>;
  estimateGas: (params: {
    toAddress: string;
    amount: string;
    tokenAddress?: string | null;
    speedOption?: "slow" | "standard" | "fast";
  }) => Promise<GasEstimation>;
  sendToken: (params: SendTokenParams) => Promise<TransactionReceipt>;
  approveTokenForPermit2: (tokenAddress: string) => Promise<TransactionReceipt>;
}

// Create the wallet context with a default value
export const WalletContext = createContext<WalletContextType>({
  state: {
    wallets: [],
    selectedWallet: null,
    balances: {},
    isLoading: false,
    error: null,
  },
  tokens: [],
  loadWallets: async () => {},
  generateWallet: async () => "",
  selectWallet: () => {},
  refreshBalances: async () => {},
  estimateGas: async () => ({} as GasEstimation),
  sendToken: async () => ({} as TransactionReceipt),
  approveTokenForPermit2: async () => ({} as TransactionReceipt),
});

// Define action types
type WalletAction =
  | { type: "LOAD_WALLETS_REQUEST" }
  | { type: "LOAD_WALLETS_SUCCESS"; payload: Wallet[] }
  | { type: "LOAD_WALLETS_FAILURE"; payload: string }
  | { type: "GENERATE_WALLET_REQUEST" }
  | { type: "GENERATE_WALLET_SUCCESS"; payload: Wallet }
  | { type: "GENERATE_WALLET_FAILURE"; payload: string }
  | { type: "SELECT_WALLET"; payload: Wallet }
  | { type: "LOAD_BALANCES_REQUEST"; payload: string }
  | {
      type: "LOAD_BALANCES_SUCCESS";
      payload: { address: string; balances: TokenBalance[] };
    }
  | {
      type: "LOAD_BALANCES_FAILURE";
      payload: { address: string; error: string };
    };

// Wallet reducer
const walletReducer = (
  state: WalletState,
  action: WalletAction
): WalletState => {
  switch (action.type) {
    case "LOAD_WALLETS_REQUEST":
    case "GENERATE_WALLET_REQUEST":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOAD_WALLETS_SUCCESS":
      return {
        ...state,
        isLoading: false,
        wallets: action.payload,
        // Set the selected wallet to the first one if none is selected
        selectedWallet:
          state.selectedWallet ||
          (action.payload.length > 0 ? action.payload[0] : null),
        error: null,
      };
    case "GENERATE_WALLET_SUCCESS":
      return {
        ...state,
        isLoading: false,
        wallets: [...state.wallets, action.payload],
        selectedWallet: action.payload, // Select the newly generated wallet
        error: null,
      };
    case "LOAD_WALLETS_FAILURE":
    case "GENERATE_WALLET_FAILURE":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "SELECT_WALLET":
      return {
        ...state,
        selectedWallet: action.payload,
      };
    case "LOAD_BALANCES_REQUEST":
      return {
        ...state,
        isLoading: true,
      };
    case "LOAD_BALANCES_SUCCESS":
      return {
        ...state,
        isLoading: false,
        balances: {
          ...state.balances,
          [action.payload.address]: action.payload.balances,
        },
      };
    case "LOAD_BALANCES_FAILURE":
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };
    default:
      return state;
  }
};

// Initial wallet state
const initialState: WalletState = {
  wallets: [],
  selectedWallet: null,
  balances: {},
  isLoading: false,
  error: null,
};

// Wallet provider component
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const [tokens, setTokens] = React.useState<Token[]>([]);
  const { state: authState } = useContext(AuthContext);
  const [walletsLoaded, setWalletsLoaded] = React.useState(false);

  // Load tokens on mount
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const tokenList = await TokenService.getTokenList();
        setTokens(tokenList);
      } catch (error) {
        console.error("Failed to load tokens:", error);
      }
    };

    loadTokens();
  }, []);

  // Memoized load wallets function using useCallback
  const loadWallets = useCallback(async () => {
    if (!authState.isAuthenticated) return;

    dispatch({ type: "LOAD_WALLETS_REQUEST" });
    try {
      const wallets = await WalletService.getUserWallets();
      dispatch({ type: "LOAD_WALLETS_SUCCESS", payload: wallets });
      setWalletsLoaded(true);

      // Load balances for the first wallet if available
      if (wallets.length > 0) {
        refreshBalances(wallets[0].address);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to load wallets";
      dispatch({ type: "LOAD_WALLETS_FAILURE", payload: message });
      toast.error(message);
    }
  }, [authState.isAuthenticated]);

  // Load wallets when user is authenticated
  useEffect(() => {
    if (authState.isAuthenticated && !walletsLoaded) {
      loadWallets();
    }
  }, [authState.isAuthenticated, loadWallets, walletsLoaded]);

  // Generate a new wallet
  const generateWallet = async (name?: string): Promise<string> => {
    dispatch({ type: "GENERATE_WALLET_REQUEST" });
    try {
      const result = await WalletService.generateWallet(name);

      // Fetch the full wallet details
      const wallet = await WalletService.getWallet(result.address);

      dispatch({ type: "GENERATE_WALLET_SUCCESS", payload: wallet });
      toast.success("Wallet generated successfully!");

      // Load balances for the new wallet
      refreshBalances(wallet.address);

      return wallet.address;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to generate wallet";
      dispatch({ type: "GENERATE_WALLET_FAILURE", payload: message });
      toast.error(message);
      return "";
    }
  };

  // Select a wallet
  const selectWallet = (wallet: Wallet) => {
    dispatch({ type: "SELECT_WALLET", payload: wallet });

    // Load balances if not already loaded
    if (!state.balances[wallet.address]) {
      refreshBalances(wallet.address);
    }
  };

  // Refresh balances for a wallet
  const refreshBalances = async (address: string) => {
    dispatch({ type: "LOAD_BALANCES_REQUEST", payload: address });
    try {
      const balances = await WalletService.getTokenBalances(address);
      dispatch({
        type: "LOAD_BALANCES_SUCCESS",
        payload: { address, balances },
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to load balances";
      dispatch({
        type: "LOAD_BALANCES_FAILURE",
        payload: { address, error: message },
      });
      toast.error(message);
    }
  };

  // Estimate gas for a token transfer
  const estimateGas = async (params: {
    toAddress: string;
    amount: string;
    tokenAddress?: string | null;
    speedOption?: "slow" | "standard" | "fast";
  }): Promise<GasEstimation> => {
    if (!state.selectedWallet) {
      throw new Error("No wallet selected");
    }

    try {
      return await WalletService.estimateGas(
        state.selectedWallet.address,
        params.toAddress,
        params.amount,
        params.tokenAddress,
        params.speedOption
      );
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to estimate gas";
      toast.error(message);
      throw error;
    }
  };

  // Send tokens from the selected wallet
  const sendToken = async (
    params: SendTokenParams
  ): Promise<TransactionReceipt> => {
    if (!state.selectedWallet) {
      throw new Error("No wallet selected");
    }

    try {
      const result = await WalletService.sendToken(
        state.selectedWallet.address,
        params
      );

      // Refresh balances after sending tokens
      setTimeout(() => {
        if (state.selectedWallet) {
          refreshBalances(state.selectedWallet.address);
        }
      }, 3000);

      toast.success("Transaction submitted!");
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to send tokens";
      toast.error(message);
      throw error;
    }
  };

  // Approve token for Permit2
  const approveTokenForPermit2 = async (
    tokenAddress: string
  ): Promise<TransactionReceipt> => {
    if (!state.selectedWallet) {
      throw new Error("No wallet selected");
    }

    try {
      const result = await WalletService.approveTokenForPermit2(
        state.selectedWallet.address,
        tokenAddress
      );

      toast.success("Token approved for swapping!");
      return result;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to approve token";
      toast.error(message);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        state,
        tokens,
        loadWallets,
        generateWallet,
        selectWallet,
        refreshBalances,
        estimateGas,
        sendToken,
        approveTokenForPermit2,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
