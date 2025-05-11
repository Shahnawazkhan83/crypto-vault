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
} from "@heroicons/react/24/outline";
import { Listbox, Transition } from "@headlessui/react";
import useWallet from "../../hooks/useWallet";
import { formatAddress, formatBalance } from "../../utils/formatters";
import { isValidAmount } from "../../utils/validators";
import type { TokenBalance } from "../../types/wallet.types";
import type {
  SwapPrice,
  SwapQuote,
  SwapExecutionResult,
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

  // Filter tokens with positive balances
  const availableFromTokens = useMemo(() => {
    return balances.filter((token) => parseFloat(token.balance) > 0);
  }, [balances]);

  // Filter tokens for the "to" selection (exclude the "from" token)
  const availableToTokens = useMemo(() => {
    return tokens.filter(
      (token) => !fromToken || token.symbol !== fromToken.symbol
    );
  }, [tokens, fromToken]);

  // Filtered tokens based on search
  const filteredFromTokens = useMemo(() => {
    if (!fromTokenSearch) return availableFromTokens;
    return availableFromTokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(fromTokenSearch.toLowerCase()) ||
        token.name.toLowerCase().includes(fromTokenSearch.toLowerCase())
    );
  }, [availableFromTokens, fromTokenSearch]);

  const filteredToTokens = useMemo(() => {
    if (!toTokenSearch) return availableToTokens;
    return availableToTokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(toTokenSearch.toLowerCase()) ||
        token.name.toLowerCase().includes(toTokenSearch.toLowerCase())
    );
  }, [availableToTokens, toTokenSearch]);

  // Set default tokens when balances are loaded
  useEffect(() => {
    if (availableFromTokens.length > 0 && !fromToken) {
      // Default to ETH if available
      const ethToken = availableFromTokens.find(
        (token) => token.symbol === "ETH"
      );
      setFromToken(ethToken || availableFromTokens[0]);
    }
  }, [availableFromTokens, fromToken]);

  useEffect(() => {
    if (availableToTokens.length > 0 && !toToken) {
      // Default to USDC if available, and convert Token to TokenBalance
      const usdcToken = availableToTokens.find(
        (token) => token.symbol === "USDC"
      );

      // Create a TokenBalance from the Token by adding a balance property
      const tokenToUse = usdcToken || availableToTokens[0];
      setToToken({
        ...tokenToUse,
        balance: "0", // Set a default balance or fetch the actual balance
      });
    }
  }, [availableToTokens, toToken]);

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
      // Only flip if the "to" token has a balance
      const toTokenWithBalance = balances.find(
        (t) => t.symbol === toToken.symbol
      );
      if (toTokenWithBalance) {
        setFromToken(toToken);
        setToToken(fromToken);
        setAmount("");
        setPrice(null);
        setQuote(null);
      }
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
    <div className="py-6">
      <div className="container-app max-w-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Swap Tokens
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Exchange tokens at the best market rates
          </p>
        </div>

        {swapResult ? (
          <div className="bg-white dark:bg-dark-800 rounded-lg border border-slate-200 dark:border-dark-700 shadow-sm p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 dark:bg-success-900/30">
                <CheckCircleIcon className="h-8 w-8 text-success-600 dark:text-success-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                Swap Submitted!
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your swap transaction has been successfully submitted to the
                network.
              </p>

              <div className="mt-6 bg-slate-50 dark:bg-dark-700 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      From
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {swapResult.sellAmount} {swapResult.sellToken}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      To
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {swapResult.buyAmount} {swapResult.buyToken}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-dark-600">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Transaction Hash
                  </p>
                  <div className="mt-1 flex items-center justify-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                      {formatAddress(swapResult.transactionHash, 12, 10)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          swapResult.transactionHash
                        )
                      }
                      className="ml-2 text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
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

              <div className="mt-6 flex justify-center space-x-4">
                <a
                  href={`https://etherscan.io/tx/${swapResult.transactionHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline btn-md"
                >
                  View on Etherscan
                </a>
                <button
                  type="button"
                  onClick={() => setSwapResult(null)}
                  className="btn-primary btn-md"
                >
                  Swap More Tokens
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-800 rounded-lg border border-slate-200 dark:border-dark-700 shadow-sm overflow-hidden">
            <div className="p-6">
              {/* From Token */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="form-label">From</label>
                  {fromToken && (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Balance:{" "}
                      {formatBalance(fromToken.balance, fromToken.decimals)}{" "}
                      {fromToken.symbol}
                    </div>
                  )}
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Listbox value={fromToken} onChange={setFromToken}>
                      {({ open }) => (
                        <>
                          <Listbox.Button className="flex items-center rounded-md bg-slate-100 dark:bg-dark-700 py-1.5 pl-3 pr-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-600">
                            {fromToken ? (
                              <>
                                {fromToken.logoURI ? (
                                  <img
                                    src={fromToken.logoURI}
                                    alt={fromToken.symbol}
                                    className="h-5 w-5 rounded-full mr-1.5"
                                  />
                                ) : (
                                  <div className="h-5 w-5 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-1.5">
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
                            <ChevronDownIcon className="h-4 w-4 ml-1" />
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
                            <Listbox.Options className="absolute left-0 z-10 mt-2 w-60 origin-top-left rounded-md bg-white dark:bg-dark-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="p-2">
                                <input
                                  type="text"
                                  className="input-primary py-1.5 px-3 text-sm"
                                  placeholder="Search token..."
                                  value={fromTokenSearch}
                                  onChange={(e) =>
                                    setFromTokenSearch(e.target.value)
                                  }
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto py-1">
                                {filteredFromTokens.length === 0 ? (
                                  <div className="py-2 px-3 text-sm text-slate-500 dark:text-slate-400">
                                    No tokens available with balance
                                  </div>
                                ) : (
                                  filteredFromTokens.map((token) => (
                                    <Listbox.Option
                                      key={token.symbol}
                                      className={({ active }) => `
                                        ${
                                          active
                                            ? "bg-primary-100 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100"
                                            : "text-slate-900 dark:text-slate-200"
                                        }
                                        cursor-pointer select-none relative py-2 px-3
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
                                                className="h-6 w-6 rounded-full mr-2"
                                              />
                                            ) : (
                                              <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-2">
                                                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                                  {token.symbol.charAt(0)}
                                                </span>
                                              </div>
                                            )}
                                            <div>
                                              <div className="font-medium">
                                                {token.symbol}
                                              </div>
                                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                                {token.name}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-sm text-right">
                                            <div>
                                              {formatBalance(
                                                token.balance,
                                                token.decimals
                                              )}
                                            </div>
                                            {selected && (
                                              <CheckCircleIcon
                                                className="h-5 w-5 text-primary-600 dark:text-primary-400"
                                                aria-hidden="true"
                                              />
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </Listbox.Option>
                                  ))
                                )}
                              </div>
                            </Listbox.Options>
                          </Transition>
                        </>
                      )}
                    </Listbox>
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`input-primary pl-28 pr-20 ${
                        errors.amount
                          ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500"
                          : ""
                      }`}
                      placeholder="0.0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        type="button"
                        onClick={handleSetMaxAmount}
                        className="inline-flex items-center rounded-md bg-slate-100 dark:bg-dark-700 py-1 px-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-slate-200 dark:hover:bg-dark-600 mr-2"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>
                {errors.amount && <p className="form-error">{errors.amount}</p>}
              </div>

              {/* Swap Direction */}
              <div className="my-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleFlipTokens}
                  className="bg-slate-100 dark:bg-dark-700 text-slate-500 dark:text-slate-400 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-dark-600 transition-colors"
                >
                  <ArrowDownIcon className="h-5 w-5" />
                </button>
              </div>

              {/* To Token */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="form-label">To (Estimated)</label>
                  {toToken &&
                    balances.find((t) => t.symbol === toToken.symbol) && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Balance:{" "}
                        {formatBalance(
                          balances.find((t) => t.symbol === toToken.symbol)
                            ?.balance || "0",
                          toToken.decimals
                        )}{" "}
                        {toToken.symbol}
                      </div>
                    )}
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Listbox value={toToken} onChange={setToToken}>
                      {({ open }) => (
                        <>
                          <Listbox.Button className="flex items-center rounded-md bg-slate-100 dark:bg-dark-700 py-1.5 pl-3 pr-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-600">
                            {toToken ? (
                              <>
                                {toToken.logoURI ? (
                                  <img
                                    src={toToken.logoURI}
                                    alt={toToken.symbol}
                                    className="h-5 w-5 rounded-full mr-1.5"
                                  />
                                ) : (
                                  <div className="h-5 w-5 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-1.5">
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
                            <ChevronDownIcon className="h-4 w-4 ml-1" />
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
                            <Listbox.Options className="absolute left-0 z-10 mt-2 w-60 origin-top-left rounded-md bg-white dark:bg-dark-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="p-2">
                                <input
                                  type="text"
                                  className="input-primary py-1.5 px-3 text-sm"
                                  placeholder="Search token..."
                                  value={toTokenSearch}
                                  onChange={(e) =>
                                    setToTokenSearch(e.target.value)
                                  }
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto py-1">
                                {filteredToTokens.length === 0 ? (
                                  <div className="py-2 px-3 text-sm text-slate-500 dark:text-slate-400">
                                    No tokens found
                                  </div>
                                ) : (
                                  filteredToTokens.map((token) => (
                                    <Listbox.Option
                                      key={token.symbol}
                                      className={({ active }) => `
                                        ${
                                          active
                                            ? "bg-primary-100 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100"
                                            : "text-slate-900 dark:text-slate-200"
                                        }
                                        cursor-pointer select-none relative py-2 px-3
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
                                                className="h-6 w-6 rounded-full mr-2"
                                              />
                                            ) : (
                                              <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-2">
                                                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                                  {token.symbol.charAt(0)}
                                                </span>
                                              </div>
                                            )}
                                            <div>
                                              <div className="font-medium">
                                                {token.symbol}
                                              </div>
                                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                                {token.name}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            {selected && (
                                              <CheckCircleIcon
                                                className="h-5 w-5 text-primary-600 dark:text-primary-400"
                                                aria-hidden="true"
                                              />
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </Listbox.Option>
                                  ))
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
                    className="input-primary pl-28 bg-slate-50 dark:bg-dark-700 text-slate-500 dark:text-slate-400"
                    placeholder="0.0"
                  />
                </div>
              </div>

              {/* Price Info */}
              {price && !isLoadingPrice && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-dark-700 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      Price
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      1 {fromToken?.symbol} ={" "}
                      {formatBalance(price.price, 18, 6)} {toToken?.symbol}
                    </span>
                  </div>
                  {price.sources && price.sources.length > 0 && (
                    <div className="flex justify-between text-sm mt-1">
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
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Slippage Tolerance
                    </span>
                    <div className="flex items-center space-x-2">
                      {["0.5", "1.0", "2.0"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSlippage(s)}
                          className={`px-2 py-0.5 rounded-md text-xs ${
                            slippage === s
                              ? "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
                              : "bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-slate-400"
                          }`}
                        >
                          {s}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Messages */}
              {errors.price && (
                <div className="mt-4 p-3 rounded-md bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800">
                  <div className="flex">
                    <ExclamationCircleIcon className="h-5 w-5 text-danger-400 dark:text-danger-500 mr-2" />
                    <p className="text-sm text-danger-700 dark:text-danger-400">
                      {errors.price}
                    </p>
                  </div>
                </div>
              )}

              {errors.quote && (
                <div className="mt-4 p-3 rounded-md bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800">
                  <div className="flex">
                    <ExclamationCircleIcon className="h-5 w-5 text-danger-400 dark:text-danger-500 mr-2" />
                    <p className="text-sm text-danger-700 dark:text-danger-400">
                      {errors.quote}
                    </p>
                  </div>
                </div>
              )}

              {isLoadingPrice && (
                <div className="mt-4 text-center py-3">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Getting best price...
                  </p>
                </div>
              )}

              {/* Swap Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGetQuote}
                  disabled={
                    !fromToken ||
                    !toToken ||
                    !amount ||
                    !price ||
                    isLoadingPrice ||
                    isLoadingQuote
                  }
                  className="btn-primary w-full py-2.5"
                >
                  {isLoadingQuote ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  ) : !price ? (
                    "Invalid Swap"
                  ) : (
                    "Review Swap"
                  )}
                </button>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 flex items-start space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <InformationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  Swap quotes are provided by 0x Protocol, which aggregates
                  liquidity from multiple DEXes to get you the best price.
                  Slippage tolerance is the maximum price difference you're
                  willing to accept.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && quote && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
              ></div>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white dark:bg-dark-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30">
                    <ArrowsRightLeftIcon
                      className="h-6 w-6 text-primary-600 dark:text-primary-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3
                      className="text-lg leading-6 font-medium text-slate-900 dark:text-white"
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

                <div className="mt-5 sm:mt-6">
                  <div className="bg-slate-50 dark:bg-dark-700 rounded-md p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        {fromToken?.logoURI ? (
                          <img
                            src={fromToken.logoURI}
                            alt={fromToken.symbol}
                            className="h-8 w-8 rounded-full mr-2"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-2">
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              {fromToken?.symbol.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {amount} {quote.sellTokenSymbol}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            From
                          </p>
                        </div>
                      </div>
                      <ArrowsRightLeftIcon className="h-5 w-5 text-slate-400" />
                      <div className="flex items-center">
                        {toToken?.logoURI ? (
                          <img
                            src={toToken.logoURI}
                            alt={toToken.symbol}
                            className="h-8 w-8 rounded-full mr-2"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-2">
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              {toToken?.symbol.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {formatBalance(
                              quote.buyAmount,
                              toToken?.decimals || 18
                            )}{" "}
                            {quote.buyTokenSymbol}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            To
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          Rate
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          1 {quote.sellTokenSymbol} ={" "}
                          {formatBalance(quote.price, 18, 6)}{" "}
                          {quote.buyTokenSymbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          Price Impact
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {/* This should be calculated based on quote data, using placeholder for now */}
                          &lt; 0.5%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          Slippage Tolerance
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {slippage}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          Network Fee
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          ~{formatBalance(quote.gas, 0)} gas
                        </span>
                      </div>
                    </div>
                  </div>

                  {errors.swap && (
                    <div className="mb-4 p-3 rounded-md bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800">
                      <div className="flex">
                        <ExclamationCircleIcon className="h-5 w-5 text-danger-400 dark:text-danger-500 mr-2" />
                        <p className="text-sm text-danger-700 dark:text-danger-400">
                          {errors.swap}
                        </p>
                      </div>
                    </div>
                  )}

                  {quote.needsAllowance && (
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={handleApproveToken}
                        disabled={isApproving}
                        className="btn-primary w-full relative"
                      >
                        {isApproving ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          `Approve ${quote.sellTokenSymbol} for Swapping`
                        )}
                      </button>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        You need to approve this token for trading first. This
                        is a one-time action for each token.
                      </p>
                    </div>
                  )}

                  <div className="sm:grid sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="btn-outline w-full"
                      onClick={() => setShowConfirmation(false)}
                      disabled={isSwapping}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary w-full mt-3 sm:mt-0 relative"
                      onClick={handleConfirmSwap}
                      disabled={isSwapping || quote.needsAllowance}
                    >
                      {isSwapping ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        "Confirm Swap"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Swap;
