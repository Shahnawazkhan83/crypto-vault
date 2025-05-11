import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ArrowDownIcon,
  BoltSlashIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Listbox, Transition } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import useWallet from "../../hooks/useWallet";
import { formatAddress, formatBalance } from "../../utils/formatters";
import { isValidAmount } from "../../utils/validators";
import type { TokenBalance } from "../../types/wallet.types";
import type {
  SwapPrice,
  SwapQuote,
  SwapExecutionResult,
  Token,
} from "../../types/token.types";
import SwapService from "../../services/swapService";

const Swap: React.FC = () => {
  const { state, tokens, approveTokenForPermit2 } = useWallet();

  // Form state
  const [fromToken, setFromToken] = useState<TokenBalance | null>(null);
  const [toToken, setToToken] = useState<TokenBalance | null>(null);
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("1.0");
  const [fromTokenSearch, setFromTokenSearch] = useState("");
  const [toTokenSearch, setToTokenSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Quote state
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [price, setPrice] = useState<SwapPrice | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState<SwapExecutionResult | null>(
    null
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Get the wallet and its balances
  const wallet = state.selectedWallet;
  const balances = wallet ? state.balances[wallet.address] || [] : [];

  // Create a map of token symbols to balances for quick lookup
  const balanceMap = useMemo(() => {
    const map: Record<string, string> = {};
    balances.forEach((token) => {
      map[token.symbol] = token.balance;
    });
    return map;
  }, [balances]);

  // Convert all tokens to TokenBalance objects for consistency
  const allTokensAsBalances = useMemo(() => {
    return tokens.map((token) => {
      const balance = balanceMap[token.symbol] || "0";
      return {
        ...token,
        balance,
      } as TokenBalance;
    });
  }, [tokens, balanceMap]);

  // Filtered tokens based on search for both dropdowns
  const filteredFromTokens = useMemo(() => {
    if (!fromTokenSearch) return allTokensAsBalances;
    return allTokensAsBalances.filter(
      (token) =>
        token.symbol.toLowerCase().includes(fromTokenSearch.toLowerCase()) ||
        token.name.toLowerCase().includes(fromTokenSearch.toLowerCase())
    );
  }, [allTokensAsBalances, fromTokenSearch]);

  const filteredToTokens = useMemo(() => {
    // Filter out the current "from" token from the "to" token list
    const availableToTokens = allTokensAsBalances.filter(
      (token) => !fromToken || token.symbol !== fromToken.symbol
    );

    if (!toTokenSearch) return availableToTokens;
    return availableToTokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(toTokenSearch.toLowerCase()) ||
        token.name.toLowerCase().includes(toTokenSearch.toLowerCase())
    );
  }, [allTokensAsBalances, fromToken, toTokenSearch]);

  // Set default tokens when balances are loaded
  useEffect(() => {
    if (allTokensAsBalances.length > 0 && !fromToken) {
      // Default to ETH if available
      const ethToken = allTokensAsBalances.find(
        (token) => token.symbol === "ETH"
      );
      setFromToken(ethToken || allTokensAsBalances[0]);
    }
  }, [allTokensAsBalances, fromToken]);

  useEffect(() => {
    if (allTokensAsBalances.length > 0 && !toToken) {
      // Default to USDC if available and not the same as from token
      const usdcToken = allTokensAsBalances.find(
        (token) =>
          token.symbol === "USDC" &&
          (fromToken ? token.symbol !== fromToken.symbol : true)
      );

      if (usdcToken) {
        setToToken(usdcToken);
      } else {
        // Find the first token that isn't the fromToken
        const differentToken = allTokensAsBalances.find((token) =>
          fromToken ? token.symbol !== fromToken.symbol : true
        );
        setToToken(differentToken || null);
      }
    }
  }, [allTokensAsBalances, fromToken, toToken]);

  // Fetch price quote when inputs change
  useEffect(() => {
    const getPriceQuote = async () => {
      if (
        !fromToken ||
        !toToken ||
        !amount ||
        !wallet ||
        parseFloat(amount) === 0
      ) {
        setPrice(null);
        setQuote(null);
        return;
      }

      if (!isValidAmount(amount)) {
        setErrors({ amount: "Invalid amount" });
        return;
      }

      // Check if the user has enough balance
      const fromTokenBalance = parseFloat(fromToken.balance);
      const amountValue = parseFloat(amount);

      if (fromTokenBalance < amountValue) {
        setErrors({ amount: "Insufficient balance" });
        return;
      }

      setIsLoadingPrice(true);
      setErrors({});

      try {
        const priceQuote = await SwapService.getPrice(
          fromToken.symbol,
          toToken.symbol,
          amount,
          wallet.address
        );
        setPrice(priceQuote);
      } catch (error: any) {
        setErrors({ price: error.message || "Failed to get price quote" });
      } finally {
        setIsLoadingPrice(false);
      }
    };

    // Debounce price quote requests
    const timerId = setTimeout(() => {
      getPriceQuote();
    }, 500);

    return () => clearTimeout(timerId);
  }, [fromToken, toToken, amount, wallet]);

  // Handle token swap
  const handleGetQuote = async () => {
    if (!fromToken || !toToken || !amount || !wallet) return;

    setIsLoadingQuote(true);
    setErrors({});

    try {
      const swapQuote = await SwapService.getSwapQuote(
        fromToken.symbol,
        toToken.symbol,
        amount,
        wallet.address,
        slippage
      );
      setQuote(swapQuote);
      setShowConfirmation(true);
    } catch (error: any) {
      setErrors({ quote: error.message || "Failed to get swap quote" });
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Handle approval for token (if needed)
  const handleApproveToken = async () => {
    if (!fromToken || !fromToken.address || !wallet) return;

    setIsApproving(true);

    try {
      await approveTokenForPermit2(fromToken.address);

      // Refetch quote to update approval status
      const swapQuote = await SwapService.getSwapQuote(
        fromToken.symbol,
        toToken!.symbol,
        amount,
        wallet.address,
        slippage
      );
      setQuote(swapQuote);
    } catch (error: any) {
      setErrors({ approval: error.message || "Failed to approve token" });
    } finally {
      setIsApproving(false);
    }
  };

  // Handle swap confirmation
  const handleConfirmSwap = async () => {
    if (!quote || !wallet) return;

    setIsSwapping(true);
    setErrors({});

    try {
      const result = await SwapService.executeSwap(wallet.address, quote);
      setSwapResult(result);
      setShowConfirmation(false);

      // Reset form
      setAmount("");
      setPrice(null);
      setQuote(null);
    } catch (error: any) {
      setErrors({ swap: error.message || "Failed to execute swap" });
    } finally {
      setIsSwapping(false);
    }
  };

  // Handle token flip
  const handleFlipTokens = () => {
    if (fromToken && toToken) {
      setFromToken(toToken);
      setToToken(fromToken);
      setAmount("");
      setPrice(null);
      setQuote(null);
    }
  };

  // Handle setting max amount
  const handleSetMaxAmount = () => {
    if (!fromToken) return;

    // For ETH, leave some for gas
    if (fromToken.symbol === "ETH") {
      const balance = parseFloat(fromToken.balance);
      const reserveForGas = 0.01; // Reserve 0.01 ETH for gas
      const maxAmount = Math.max(0, balance - reserveForGas).toString();
      setAmount(maxAmount);
    } else {
      setAmount(fromToken.balance);
    }
  };

  // Check if there's enough balance for the from token
  const hasEnoughBalance = useMemo(() => {
    if (!fromToken || !amount) return true;

    const balance = parseFloat(fromToken.balance);
    const amountValue = parseFloat(amount);

    return !isNaN(amountValue) && !isNaN(balance) && balance >= amountValue;
  }, [fromToken, amount]);

  // Determine if the swap button should be enabled
  const canSwap = useMemo(() => {
    return (
      fromToken &&
      toToken &&
      amount &&
      parseFloat(amount) > 0 &&
      price &&
      !isLoadingPrice &&
      !isLoadingQuote &&
      hasEnoughBalance
    );
  }, [
    fromToken,
    toToken,
    amount,
    price,
    isLoadingPrice,
    isLoadingQuote,
    hasEnoughBalance,
  ]);

  if (!wallet) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center">
          <ArrowsRightLeftIcon className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
          No wallet selected
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Please select or create a wallet to use the swap feature.
        </p>
        <div className="mt-6">
          <Link to="/wallets" className="btn-primary btn-md">
            Manage Wallets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container-app max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 text-center md:text-left"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Swap Tokens
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Exchange tokens at the best market rates with liquidity from
            multiple DEXes through 0x Protocol.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {swapResult ? (
            <motion.div
              key="swap-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-xl overflow-hidden"
            >
              <div className="p-6 sm:p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 dark:bg-success-900/30">
                  <CheckCircleIcon className="h-10 w-10 text-success-600 dark:text-success-400" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                  Swap Submitted!
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Your swap transaction has been successfully submitted to the
                  network.
                </p>

                <div className="mt-6 bg-slate-50 dark:bg-dark-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-dark-600">
                    <div className="flex flex-col items-start">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        From
                      </p>
                      <p className="text-base font-medium text-slate-900 dark:text-white">
                        {swapResult.sellAmount} {swapResult.sellToken}
                      </p>
                    </div>
                    <ArrowsRightLeftIcon className="h-5 w-5 text-slate-400" />
                    <div className="flex flex-col items-end">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        To
                      </p>
                      <p className="text-base font-medium text-slate-900 dark:text-white">
                        {swapResult.buyAmount} {swapResult.buyToken}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Transaction Hash
                    </p>
                    <div className="flex items-center justify-between mt-1 p-3 bg-slate-100 dark:bg-dark-600 rounded-lg">
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-mono truncate">
                        {formatAddress(swapResult.transactionHash, 16, 14)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            swapResult.transactionHash
                          )
                        }
                        className="ml-2 text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-dark-500 transition-colors"
                      >
                        <span className="sr-only">Copy transaction hash</span>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center space-x-4">
                  <a
                    href={`https://etherscan.io/tx/${swapResult.transactionHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline btn-md group"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 18c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Zm10-6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2ZM7 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Z"></path>
                    </svg>
                    View on Etherscan
                  </a>
                  <button
                    type="button"
                    onClick={() => setSwapResult(null)}
                    className="btn-primary btn-md"
                  >
                    <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
                    Swap More Tokens
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="swap-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-xl overflow-hidden backdrop-blur-sm"
            >
              <div className="p-6 sm:p-8">
                {/* From Token */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="form-label font-medium text-slate-900 dark:text-white">
                      You pay
                    </label>
                    {fromToken && (
                      <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                        Balance:{" "}
                        <span
                          className={`ml-1 ${
                            parseFloat(fromToken.balance) === 0
                              ? "text-slate-400 dark:text-slate-500"
                              : "text-slate-700 dark:text-slate-300 font-medium"
                          }`}
                        >
                          {formatBalance(fromToken.balance, fromToken.decimals)}{" "}
                          {fromToken.symbol}
                        </span>
                        {parseFloat(fromToken.balance) > 0 && (
                          <button
                            type="button"
                            onClick={handleSetMaxAmount}
                            className="ml-2 inline-flex items-center rounded-md bg-primary-50 dark:bg-primary-900/20 py-1 px-2 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800/30 transition-colors"
                          >
                            MAX
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 relative rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus-within:border-primary-500 dark:focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                      <Listbox value={fromToken} onChange={setFromToken}>
                        {({ open }) => (
                          <>
                            <Listbox.Button className="flex items-center rounded-lg bg-slate-50 dark:bg-dark-700 py-2 pl-3 pr-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-dark-600 border border-slate-200 dark:border-dark-700 transition-colors">
                              {fromToken ? (
                                <>
                                  {fromToken.logoURI ? (
                                    <img
                                      src={fromToken.logoURI}
                                      alt={fromToken.symbol}
                                      className="h-6 w-6 rounded-full mr-2"
                                    />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-2">
                                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                        {fromToken.symbol.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                  <span>{fromToken.symbol}</span>
                                </>
                              ) : (
                                <span>Select</span>
                              )}
                              <ChevronDownIcon className="h-4 w-4 ml-2 text-slate-400" />
                            </Listbox.Button>
                            <Transition
                              show={open}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Listbox.Options className="absolute left-0 z-10 mt-2 w-64 origin-top-left rounded-xl bg-white dark:bg-dark-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-200 dark:border-dark-700">
                                <div className="sticky top-0 z-10 bg-white dark:bg-dark-800 p-3 border-b border-slate-200 dark:border-dark-700">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      className="input-primary py-2 pl-9 text-sm w-full shadow-none"
                                      placeholder="Search tokens..."
                                      value={fromTokenSearch}
                                      onChange={(e) =>
                                        setFromTokenSearch(e.target.value)
                                      }
                                    />
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                      <svg
                                        className="w-4 h-4 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto py-2 custom-scrollbar">
                                  {filteredFromTokens.length === 0 ? (
                                    <div className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                                      No tokens found
                                    </div>
                                  ) : (
                                    filteredFromTokens.map((token) => {
                                      const hasBalance =
                                        parseFloat(token.balance) > 0;

                                      return (
                                        <Listbox.Option
                                          key={token.symbol}
                                          className={({ active }) => `
                                            ${
                                              active
                                                ? "bg-primary-50 dark:bg-primary-900/20"
                                                : ""
                                            }
                                            cursor-pointer select-none relative py-2.5 px-4 transition-colors
                                          `}
                                          value={token}
                                        >
                                          {({ selected, active }) => (
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center">
                                                {token.logoURI ? (
                                                  <img
                                                    src={token.logoURI}
                                                    alt={token.symbol}
                                                    className="h-8 w-8 rounded-full mr-3"
                                                  />
                                                ) : (
                                                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-3">
                                                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                                      {token.symbol.charAt(0)}
                                                    </span>
                                                  </div>
                                                )}
                                                <div>
                                                  <div
                                                    className={`font-medium ${
                                                      hasBalance
                                                        ? "text-slate-900 dark:text-white"
                                                        : "text-slate-600 dark:text-slate-400"
                                                    }`}
                                                  >
                                                    {token.symbol}
                                                  </div>
                                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                                    {token.name}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="text-right flex flex-col items-end">
                                                <div
                                                  className={`text-sm ${
                                                    hasBalance
                                                      ? "text-slate-700 dark:text-slate-300"
                                                      : "text-slate-400 dark:text-slate-500"
                                                  }`}
                                                >
                                                  {formatBalance(
                                                    token.balance,
                                                    token.decimals
                                                  )}
                                                </div>
                                                {selected && (
                                                  <CheckCircleIcon
                                                    className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5"
                                                    aria-hidden="true"
                                                  />
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </Listbox.Option>
                                      );
                                    })
                                  )}
                                </div>
                              </Listbox.Options>
                            </Transition>
                          </>
                        )}
                      </Listbox>
                    </div>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`block w-full rounded-xl pl-36 pr-4 py-3.5 text-slate-900 dark:text-white bg-transparent border-0 focus:ring-0 text-lg sm:text-xl ${
                        errors.amount
                          ? "text-danger-500 dark:text-danger-400"
                          : ""
                      }`}
                      placeholder="0.0"
                    />
                  </div>
                  {errors.amount && (
                    <p className="form-error mt-2 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1 text-danger-500" />
                      {errors.amount}
                    </p>
                  )}
                </div>

                {/* Swap Direction */}
                <div className="my-4 flex justify-center">
                  <motion.button
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    type="button"
                    onClick={handleFlipTokens}
                    className="bg-slate-100 dark:bg-dark-700 text-slate-500 dark:text-slate-400 p-3 rounded-full hover:bg-slate-200 dark:hover:bg-dark-600 transition-colors shadow-md"
                  >
                    <ArrowDownIcon className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* To Token */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="form-label font-medium text-slate-900 dark:text-white">
                      You receive
                    </label>
                    {toToken &&
                      balances.find((t) => t.symbol === toToken.symbol) && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          Balance:{" "}
                          <span className="ml-1 text-slate-700 dark:text-slate-300 font-medium">
                            {formatBalance(
                              balances.find((t) => t.symbol === toToken.symbol)
                                ?.balance || "0",
                              toToken.decimals
                            )}{" "}
                            {toToken.symbol}
                          </span>
                        </div>
                      )}
                  </div>
                  <div className="mt-2 relative rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 focus-within:border-primary-500 dark:focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all bg-slate-50 dark:bg-dark-700/50">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                      <Listbox value={toToken} onChange={setToToken}>
                        {({ open }) => (
                          <>
                            <Listbox.Button className="flex items-center rounded-lg bg-slate-100 dark:bg-dark-700 py-2 pl-3 pr-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-dark-600 border border-slate-200 dark:border-dark-700 transition-colors">
                              {toToken ? (
                                <>
                                  {toToken.logoURI ? (
                                    <img
                                      src={toToken.logoURI}
                                      alt={toToken.symbol}
                                      className="h-6 w-6 rounded-full mr-2"
                                    />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-2">
                                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                        {toToken.symbol.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                  <span>{toToken.symbol}</span>
                                </>
                              ) : (
                                <span>Select</span>
                              )}
                              <ChevronDownIcon className="h-4 w-4 ml-2 text-slate-400" />
                            </Listbox.Button>
                            <Transition
                              show={open}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Listbox.Options className="absolute left-0 z-10 mt-2 w-64 origin-top-left rounded-xl bg-white dark:bg-dark-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-200 dark:border-dark-700">
                                <div className="sticky top-0 z-10 bg-white dark:bg-dark-800 p-3 border-b border-slate-200 dark:border-dark-700">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      className="input-primary py-2 pl-9 text-sm w-full shadow-none"
                                      placeholder="Search tokens..."
                                      value={toTokenSearch}
                                      onChange={(e) =>
                                        setToTokenSearch(e.target.value)
                                      }
                                    />
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                      <svg
                                        className="w-4 h-4 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto py-2 custom-scrollbar">
                                  {filteredToTokens.length === 0 ? (
                                    <div className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                                      No tokens found
                                    </div>
                                  ) : (
                                    filteredToTokens.map((token) => {
                                      const hasBalance =
                                        parseFloat(
                                          balanceMap[token.symbol] || "0"
                                        ) > 0;

                                      return (
                                        <Listbox.Option
                                          key={token.symbol}
                                          className={({ active }) => `
                                            ${
                                              active
                                                ? "bg-primary-50 dark:bg-primary-900/20"
                                                : ""
                                            }
                                            cursor-pointer select-none relative py-2.5 px-4 transition-colors
                                          `}
                                          value={token}
                                        >
                                          {({ selected, active }) => (
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center">
                                                {token.logoURI ? (
                                                  <img
                                                    src={token.logoURI}
                                                    alt={token.symbol}
                                                    className="h-8 w-8 rounded-full mr-3"
                                                  />
                                                ) : (
                                                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-3">
                                                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                                      {token.symbol.charAt(0)}
                                                    </span>
                                                  </div>
                                                )}
                                                <div>
                                                  <div className="font-medium text-slate-900 dark:text-white">
                                                    {token.symbol}
                                                  </div>
                                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                                    {token.name}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="text-right flex flex-col items-end">
                                                {hasBalance && (
                                                  <div className="text-sm text-slate-700 dark:text-slate-300">
                                                    {formatBalance(
                                                      balanceMap[
                                                        token.symbol
                                                      ] || "0",
                                                      token.decimals
                                                    )}
                                                  </div>
                                                )}
                                                {selected && (
                                                  <CheckCircleIcon
                                                    className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5"
                                                    aria-hidden="true"
                                                  />
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </Listbox.Option>
                                      );
                                    })
                                  )}
                                </div>
                              </Listbox.Options>
                            </Transition>
                          </>
                        )}
                      </Listbox>
                    </div>
                    <input
                      type="text"
                      value={
                        price
                          ? formatBalance(
                              price.buyAmount,
                              toToken?.decimals || 18
                            )
                          : ""
                      }
                      readOnly
                      className="block w-full rounded-xl pl-36 pr-4 py-3.5 text-slate-900 dark:text-white bg-transparent border-0 focus:ring-0 text-lg sm:text-xl"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                {/* Price Info */}
                <AnimatePresence>
                  {price && !isLoadingPrice ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="mt-6 p-4 bg-slate-50 dark:bg-dark-700/50 rounded-xl border border-slate-200 dark:border-dark-700"
                    >
                      <div className="flex justify-between text-sm items-center mb-2">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center">
                          <BoltSlashIcon className="h-4 w-4 mr-1.5 text-primary-500" />
                          Exchange Rate
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          1 {fromToken?.symbol} ={" "}
                          {formatBalance(price.price, 18, 6)} {toToken?.symbol}
                        </span>
                      </div>
                      {price.sources && price.sources.length > 0 && (
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-500 dark:text-slate-400">
                            Liquidity Source
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {price.sources[0].name}{" "}
                            {parseFloat(price.sources[0].proportion) < 1.0 &&
                              "+ others"}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center">
                          <ShieldCheckIcon className="h-4 w-4 mr-1.5 text-primary-500" />
                          Slippage Tolerance
                        </span>
                        <div className="flex items-center p-1 bg-slate-100 dark:bg-dark-600 rounded-lg">
                          {["0.5", "1.0", "2.0"].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSlippage(s)}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                slippage === s
                                  ? "bg-white dark:bg-dark-500 text-primary-700 dark:text-primary-300 shadow-sm"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              {s}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Error Messages */}
                <AnimatePresence>
                  {(errors.price || errors.quote) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 p-4 rounded-xl bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800"
                    >
                      <div className="flex">
                        <ExclamationCircleIcon className="h-5 w-5 text-danger-400 dark:text-danger-500 mr-3 flex-shrink-0" />
                        <p className="text-sm text-danger-700 dark:text-danger-400">
                          {errors.price || errors.quote}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading Indicator */}
                <AnimatePresence>
                  {isLoadingPrice && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 p-4 text-center"
                    >
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Finding the best price across DEXes...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Swap Button */}
                <div className="mt-8">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleGetQuote}
                    disabled={!canSwap}
                    className={`w-full py-4 px-6 rounded-xl font-medium text-center text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                      canSwap
                        ? "bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:ring-primary-500"
                        : "bg-slate-400 dark:bg-dark-600 cursor-not-allowed"
                    }`}
                  >
                    {isLoadingQuote ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Getting Quote...
                      </span>
                    ) : !fromToken || !toToken ? (
                      "Select Tokens"
                    ) : !amount ? (
                      "Enter Amount"
                    ) : !hasEnoughBalance ? (
                      "Insufficient Balance"
                    ) : !price ? (
                      "Invalid Swap"
                    ) : (
                      `Swap ${fromToken.symbol} for ${toToken.symbol}`
                    )}
                  </motion.button>
                </div>

                {/* Disclaimer */}
                <div className="mt-6 flex items-start space-x-3 p-4 bg-slate-50 dark:bg-dark-700/50 rounded-xl border border-slate-200 dark:border-dark-700">
                  <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-primary-500 dark:text-primary-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Swap quotes are provided by{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        0x Protocol
                      </span>
                      , which aggregates liquidity from multiple DEXes to get
                      you the best price.
                      <span className="block mt-1">
                        Slippage tolerance is the maximum price difference
                        you're willing to accept.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <Transition show={showConfirmation} as={React.Fragment}>
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div
                  className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
                  aria-hidden="true"
                ></div>
              </Transition.Child>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <div className="inline-block align-bottom bg-white dark:bg-dark-800 rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-slate-200 dark:border-dark-700">
                  <div>
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-primary-600/20 to-secondary-600/20 dark:from-primary-900/30 dark:to-secondary-900/30">
                      <ArrowsRightLeftIcon
                        className="h-8 w-8 text-primary-600 dark:text-primary-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <h3
                        className="text-xl leading-6 font-semibold text-slate-900 dark:text-white"
                        id="modal-title"
                      >
                        Confirm Swap
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Please review your swap details before confirming
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="bg-slate-50 dark:bg-dark-700/50 rounded-xl p-5 mb-5 border border-slate-200 dark:border-dark-700">
                      <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200 dark:border-dark-600">
                        <div className="flex flex-col items-start">
                          <div className="flex items-center mb-1">
                            {fromToken?.logoURI ? (
                              <img
                                src={fromToken.logoURI}
                                alt={fromToken.symbol}
                                className="h-6 w-6 rounded-full mr-2"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-2">
                                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                  {fromToken?.symbol.charAt(0)}
                                </span>
                              </div>
                            )}
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              You Pay
                            </p>
                          </div>
                          <p className="text-base font-medium text-slate-900 dark:text-white">
                            {amount} {quote?.sellTokenSymbol}
                          </p>
                        </div>
                        <div className="p-2 bg-slate-100 dark:bg-dark-600 rounded-full">
                          <ArrowsRightLeftIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center mb-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              You Receive
                            </p>
                            {toToken?.logoURI ? (
                              <img
                                src={toToken.logoURI}
                                alt={toToken.symbol}
                                className="h-6 w-6 rounded-full ml-2"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center ml-2">
                                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                  {toToken?.symbol.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-base font-medium text-slate-900 dark:text-white">
                            {quote && toToken
                              ? formatBalance(
                                  quote.buyAmount,
                                  toToken.decimals || 18
                                )
                              : "0"}{" "}
                            {quote?.buyTokenSymbol}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Rate
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            1 {quote?.sellTokenSymbol} ={" "}
                            {quote ? formatBalance(quote.price, 18, 6) : "0"}{" "}
                            {quote?.buyTokenSymbol}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Price Impact
                          </span>
                          <span className="text-success-600 dark:text-success-400 font-medium">
                            &lt; 0.5%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Slippage Tolerance
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {slippage}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Network Fee
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            ~{quote?.gas ? formatBalance(quote.gas, 0) : "0"}{" "}
                            gas
                          </span>
                        </div>
                      </div>
                    </div>

                    {errors.swap && (
                      <div className="mb-5 p-4 rounded-xl bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800">
                        <div className="flex">
                          <ExclamationCircleIcon className="h-5 w-5 text-danger-400 dark:text-danger-500 mr-3 flex-shrink-0" />
                          <p className="text-sm text-danger-700 dark:text-danger-400">
                            {errors.swap}
                          </p>
                        </div>
                      </div>
                    )}

                    {quote?.needsAllowance && (
                      <div className="mb-5">
                        <button
                          type="button"
                          onClick={handleApproveToken}
                          disabled={isApproving}
                          className="btn-primary w-full py-3 relative flex items-center justify-center"
                        >
                          {isApproving ? (
                            <span className="flex items-center justify-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Approving {quote.sellTokenSymbol}...
                            </span>
                          ) : (
                            <>
                              <ShieldCheckIcon className="h-5 w-5 mr-2" />
                              Approve {quote.sellTokenSymbol} for Swapping
                            </>
                          )}
                        </button>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                          You need to approve this token for trading first. This
                          is a one-time action for each token.
                        </p>
                      </div>
                    )}

                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <button
                        type="button"
                        className="btn-outline w-full py-3 flex items-center justify-center"
                        onClick={() => setShowConfirmation(false)}
                        disabled={isSwapping}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary w-full mt-3 sm:mt-0 py-3 relative flex items-center justify-center"
                        onClick={handleConfirmSwap}
                        disabled={isSwapping || quote?.needsAllowance}
                      >
                        {isSwapping ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Swapping...
                          </span>
                        ) : (
                          <>
                            <BoltSlashIcon className="h-5 w-5 mr-2" />
                            Confirm Swap
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
};

export default Swap;
