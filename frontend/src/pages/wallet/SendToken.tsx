import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRightIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import useWallet from "../../hooks/useWallet";
import {
  formatAddress,
  formatBalance,
  parseInputAmount,
} from "../../utils/formatters";
import {
  isValidAddress,
  isValidAmount,
  isValidTransactionAmount,
} from "../../utils/validators";
import type { TokenBalance, GasEstimation } from "../../types/wallet.types";
import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";

const speedOptions = [
  { id: "slow", name: "Slow", description: "Might take longer", icon: "🐢" },
  { id: "standard", name: "Standard", description: "Recommended", icon: "⚡" },
  { id: "fast", name: "Fast", description: "Priority processing", icon: "🚀" },
];

const SendToken: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { state, refreshBalances, estimateGas, sendToken } = useWallet();

  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [speedOption, setSpeedOption] = useState(speedOptions[1]); // Standard by default
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [gasEstimation, setGasEstimation] = useState<GasEstimation | null>(
    null
  );
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Get the wallet and its balances
  const wallet = state.wallets.find((w) => w.address === address);
  const balances = address ? state.balances[address] || [] : [];

  // Filter tokens with positive balances
  const availableTokens = useMemo(() => {
    return balances.filter((token) => parseFloat(token.balance) > 0);
  }, [balances]);

  // Fetch balances if not already loaded
  useEffect(() => {
    if (address && balances.length === 0) {
      refreshBalances(address);
    }
  }, [address, balances.length, refreshBalances]);

  // Set the first available token as default when balances are loaded
  useEffect(() => {
    if (availableTokens.length > 0 && !selectedToken) {
      setSelectedToken(availableTokens[0]);
    }
  }, [availableTokens, selectedToken]);

  // Handle gas estimation
  const handleEstimateGas = async () => {
    if (!validateForm(false)) return;

    setIsEstimating(true);
    setErrors({});

    try {
      const estimation = await estimateGas({
        toAddress: recipient,
        amount,
        tokenAddress: selectedToken?.address || null,
        speedOption: speedOption.id as "slow" | "standard" | "fast",
      });

      setGasEstimation(estimation);
    } catch (error: any) {
      setErrors({ estimateGas: error.message || "Failed to estimate gas" });
    } finally {
      setIsEstimating(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(true)) return;

    setShowConfirmation(true);
  };

  // Validate the form
  const validateForm = (final: boolean): boolean => {
    const newErrors: Record<string, string> = {};

    if (!recipient) {
      newErrors.recipient = "Recipient address is required";
    } else if (!isValidAddress(recipient)) {
      newErrors.recipient = "Invalid Ethereum address";
    }

    if (!amount) {
      newErrors.amount = "Amount is required";
    } else if (!isValidAmount(amount)) {
      newErrors.amount = "Invalid amount";
    } else if (
      selectedToken &&
      !isValidTransactionAmount(amount, selectedToken.balance)
    ) {
      newErrors.amount = "Insufficient balance";
    }

    if (!selectedToken) {
      newErrors.token = "Select a token to send";
    }

    if (final && !gasEstimation) {
      newErrors.estimateGas = "Please estimate gas before sending";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle send confirmation
  const handleConfirmSend = async () => {
    if (!validateForm(true) || !selectedToken || !gasEstimation) return;

    setIsSending(true);

    try {
      const result = await sendToken({
        toAddress: recipient,
        amount,
        tokenAddress: selectedToken.address || null,
        gasOptions: {
          gasLimit: gasEstimation.gasEstimate,
          ...(gasEstimation.supportsEIP1559
            ? {
                maxFeePerGas: gasEstimation.maxFeePerGas,
                maxPriorityFeePerGas: gasEstimation.maxPriorityFeePerGas,
              }
            : {
                gasPrice: gasEstimation.gasPrice,
              }),
        },
      });

      setTxHash(result.transactionHash);
      // Clear form
      setAmount("");
      setRecipient("");
      setGasEstimation(null);

      // Refresh balances after a delay
      setTimeout(() => {
        if (address) refreshBalances(address);
      }, 3000);
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to send transaction" });
    } finally {
      setIsSending(false);
      setShowConfirmation(false);
    }
  };

  // Handle token selection
  const handleTokenSelect = (token: TokenBalance) => {
    setSelectedToken(token);
    setGasEstimation(null); // Reset gas estimation when token changes
  };

  // Handle setting max amount
  const handleSetMaxAmount = () => {
    if (!selectedToken) return;

    // For ETH, leave some for gas
    if (selectedToken.symbol === "ETH") {
      const balance = parseFloat(selectedToken.balance);
      const reserveForGas = 0.01; // Reserve 0.01 ETH for gas
      const maxAmount = Math.max(0, balance - reserveForGas).toString();
      setAmount(maxAmount);
    } else {
      setAmount(selectedToken.balance);
    }

    setGasEstimation(null); // Reset gas estimation when amount changes
  };

  if (!wallet) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center">
          <svg
            className="h-6 w-6 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
          Wallet not found
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The wallet address you are looking for could not be found.
        </p>
        <div className="mt-6">
          <Link to="/wallets" className="btn-primary btn-md">
            Return to Wallets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="container-app max-w-3xl">
        <div className="mb-6">
          <Link
            to={`/wallets/${address}`}
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 mb-2 inline-flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Wallet
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            Send Tokens
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Send tokens from your wallet {formatAddress(wallet.address)}
          </p>
        </div>

        {txHash ? (
          <div className="bg-white dark:bg-dark-800 rounded-lg border border-slate-200 dark:border-dark-700 shadow-sm p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 dark:bg-success-900/30">
                <CheckCircleIcon className="h-8 w-8 text-success-600 dark:text-success-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                Transaction Sent!
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your transaction has been successfully submitted to the network.
              </p>

              <div className="mt-4 p-4 bg-slate-50 dark:bg-dark-700 rounded-lg">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Transaction Hash
                </p>
                <div className="mt-1 flex items-center justify-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {txHash}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(txHash)}
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

              <div className="mt-6 flex justify-center space-x-4">
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline btn-md"
                >
                  View on Etherscan
                </a>
                <button
                  type="button"
                  onClick={() => setTxHash(null)}
                  className="btn-primary btn-md"
                >
                  Send Another Transaction
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-800 rounded-lg border border-slate-200 dark:border-dark-700 shadow-sm overflow-hidden">
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Token Selection */}
                  <div>
                    <label htmlFor="token" className="form-label">
                      Token
                    </label>
                    <div className="mt-1 relative">
                      <Listbox
                        value={selectedToken}
                        onChange={handleTokenSelect}
                      >
                        {({ open }) => (
                          <>
                            <Listbox.Button
                              className={`
                              relative w-full input-primary pl-3 pr-10 text-left cursor-default
                              ${
                                errors.token
                                  ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500"
                                  : ""
                              }
                            `}
                            >
                              {selectedToken ? (
                                <div className="flex items-center">
                                  {selectedToken.logoURI ? (
                                    <img
                                      src={selectedToken.logoURI}
                                      alt={selectedToken.symbol}
                                      className="h-6 w-6 rounded-full mr-2"
                                    />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-2">
                                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                        {selectedToken.symbol.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                  <span className="block truncate font-medium">
                                    {selectedToken.symbol}
                                  </span>
                                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                                    Balance:{" "}
                                    {formatBalance(
                                      selectedToken.balance,
                                      selectedToken.decimals
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <span className="block truncate text-slate-500 dark:text-slate-400">
                                  Select a token
                                </span>
                              )}
                              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <ChevronDownIcon
                                  className="h-5 w-5 text-slate-400"
                                  aria-hidden="true"
                                />
                              </span>
                            </Listbox.Button>
                            <Transition
                              show={open}
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-dark-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                {availableTokens.length === 0 ? (
                                  <div className="py-2 px-3 text-sm text-slate-500 dark:text-slate-400">
                                    No tokens available with balance
                                  </div>
                                ) : (
                                  availableTokens.map((token) => (
                                    <Listbox.Option
                                      key={token.symbol}
                                      className={({ active }) =>
                                        `${
                                          active
                                            ? "text-white bg-primary-600 dark:bg-primary-700"
                                            : "text-slate-900 dark:text-slate-200"
                                        } cursor-default select-none relative py-2 pl-3 pr-9`
                                      }
                                      value={token}
                                    >
                                      {({ selected, active }) => (
                                        <>
                                          <div className="flex items-center">
                                            {token.logoURI ? (
                                              <img
                                                src={token.logoURI}
                                                alt={token.symbol}
                                                className="h-6 w-6 rounded-full mr-2"
                                              />
                                            ) : (
                                              <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center mr-2">
                                                <span
                                                  className={`text-xs font-medium ${
                                                    active
                                                      ? "text-white"
                                                      : "text-primary-600 dark:text-primary-400"
                                                  }`}
                                                >
                                                  {token.symbol.charAt(0)}
                                                </span>
                                              </div>
                                            )}
                                            <span
                                              className={`${
                                                selected
                                                  ? "font-semibold"
                                                  : "font-normal"
                                              } block truncate`}
                                            >
                                              {token.symbol}
                                            </span>
                                            <span
                                              className={`${
                                                active
                                                  ? "text-white"
                                                  : "text-slate-500 dark:text-slate-400"
                                              } ml-2 truncate text-sm`}
                                            >
                                              {formatBalance(
                                                token.balance,
                                                token.decimals
                                              )}
                                            </span>
                                          </div>
                                          {selected && (
                                            <span
                                              className={`${
                                                active
                                                  ? "text-white"
                                                  : "text-primary-600 dark:text-primary-400"
                                              } absolute inset-y-0 right-0 flex items-center pr-4`}
                                            >
                                              <CheckCircleIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))
                                )}
                              </Listbox.Options>
                            </Transition>
                          </>
                        )}
                      </Listbox>
                    </div>
                    {errors.token && (
                      <p className="form-error">{errors.token}</p>
                    )}
                  </div>

                  {/* Recipient */}
                  <div>
                    <label htmlFor="recipient" className="form-label">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      id="recipient"
                      value={recipient}
                      onChange={(e) => {
                        setRecipient(e.target.value);
                        setGasEstimation(null); // Reset gas estimation when recipient changes
                      }}
                      className={`input-primary ${
                        errors.recipient
                          ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500"
                          : ""
                      }`}
                      placeholder="0x..."
                    />
                    {errors.recipient && (
                      <p className="form-error">{errors.recipient}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="flex justify-between">
                      <label htmlFor="amount" className="form-label">
                        Amount
                      </label>
                      {selectedToken && (
                        <button
                          type="button"
                          onClick={handleSetMaxAmount}
                          className="text-xs text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          Max
                        </button>
                      )}
                    </div>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="text"
                        id="amount"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setGasEstimation(null); // Reset gas estimation when amount changes
                        }}
                        className={`input-primary pr-16 ${
                          errors.amount
                            ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500"
                            : ""
                        }`}
                        placeholder="0.0"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-slate-500 dark:text-slate-400 sm:text-sm">
                          {selectedToken?.symbol || "TOKEN"}
                        </span>
                      </div>
                    </div>
                    {errors.amount && (
                      <p className="form-error">{errors.amount}</p>
                    )}
                    {selectedToken && (
                      <p className="form-hint">
                        Available:{" "}
                        {formatBalance(
                          selectedToken.balance,
                          selectedToken.decimals
                        )}{" "}
                        {selectedToken.symbol}
                      </p>
                    )}
                  </div>

                  {/* Gas Settings */}
                  <div>
                    <label className="form-label">Transaction Speed</label>
                    <div className="mt-1">
                      <Listbox value={speedOption} onChange={setSpeedOption}>
                        {({ open }) => (
                          <>
                            <div className="relative">
                              <Listbox.Button className="input-primary relative w-full pl-3 pr-10 text-left cursor-default">
                                <span className="block truncate font-medium flex items-center">
                                  <span className="mr-2">
                                    {speedOption.icon}
                                  </span>
                                  {speedOption.name}
                                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                                    {speedOption.description}
                                  </span>
                                </span>
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                  <ChevronDownIcon
                                    className="h-5 w-5 text-slate-400"
                                    aria-hidden="true"
                                  />
                                </span>
                              </Listbox.Button>
                              <Transition
                                show={open}
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-dark-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                  {speedOptions.map((option) => (
                                    <Listbox.Option
                                      key={option.id}
                                      className={({ active }) =>
                                        `${
                                          active
                                            ? "text-white bg-primary-600 dark:bg-primary-700"
                                            : "text-slate-900 dark:text-slate-200"
                                        } cursor-default select-none relative py-2 pl-3 pr-9`
                                      }
                                      value={option}
                                    >
                                      {({ selected, active }) => (
                                        <>
                                          <div className="flex items-center">
                                            <span className="mr-2">
                                              {option.icon}
                                            </span>
                                            <span
                                              className={`${
                                                selected
                                                  ? "font-semibold"
                                                  : "font-normal"
                                              } block truncate`}
                                            >
                                              {option.name}
                                            </span>
                                            <span
                                              className={`${
                                                active
                                                  ? "text-white"
                                                  : "text-slate-500 dark:text-slate-400"
                                              } ml-2 truncate text-sm`}
                                            >
                                              {option.description}
                                            </span>
                                          </div>
                                          {selected && (
                                            <span
                                              className={`${
                                                active
                                                  ? "text-white"
                                                  : "text-primary-600 dark:text-primary-400"
                                              } absolute inset-y-0 right-0 flex items-center pr-4`}
                                            >
                                              <CheckCircleIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </>
                        )}
                      </Listbox>
                    </div>
                  </div>

                  {/* Gas Estimation */}
                  <div>
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={handleEstimateGas}
                        disabled={
                          isEstimating ||
                          !recipient ||
                          !amount ||
                          !selectedToken
                        }
                        className="btn-outline btn-sm flex items-center"
                      >
                        {isEstimating ? (
                          <>
                            <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                            Estimating...
                          </>
                        ) : (
                          <>
                            <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                            Estimate Gas
                          </>
                        )}
                      </button>
                    </div>

                    {errors.estimateGas && (
                      <div className="mt-2 p-3 rounded-md bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800">
                        <div className="flex">
                          <ExclamationCircleIcon className="h-5 w-5 text-danger-400 dark:text-danger-500 mr-2" />
                          <p className="text-sm text-danger-700 dark:text-danger-400">
                            {errors.estimateGas}
                          </p>
                        </div>
                      </div>
                    )}

                    {gasEstimation && (
                      <div className="mt-4 bg-slate-50 dark:bg-dark-700 rounded-md p-4">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                          Gas Estimation
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">
                              Gas Limit
                            </span>
                            <span className="text-slate-900 dark:text-white">
                              {parseInt(
                                gasEstimation.gasEstimate
                              ).toLocaleString()}
                            </span>
                          </div>
                          {gasEstimation.supportsEIP1559 ? (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">
                                  Max Fee Per Gas
                                </span>
                                <span className="text-slate-900 dark:text-white">
                                  {formatBalance(
                                    gasEstimation.maxFeePerGas || "0",
                                    9,
                                    2
                                  )}{" "}
                                  Gwei
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">
                                  Max Priority Fee
                                </span>
                                <span className="text-slate-900 dark:text-white">
                                  {formatBalance(
                                    gasEstimation.maxPriorityFeePerGas || "0",
                                    9,
                                    2
                                  )}{" "}
                                  Gwei
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 dark:text-slate-400">
                                Gas Price
                              </span>
                              <span className="text-slate-900 dark:text-white">
                                {formatBalance(gasEstimation.gasPrice, 9, 2)}{" "}
                                Gwei
                              </span>
                            </div>
                          )}
                          <div className="pt-2 mt-2 border-t border-slate-200 dark:border-dark-600 flex justify-between text-sm font-medium">
                            <span className="text-slate-700 dark:text-slate-300">
                              Estimated Fee
                            </span>
                            <span className="text-slate-900 dark:text-white">
                              {gasEstimation.estimatedFeeETH} ETH
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={
                        !recipient ||
                        !amount ||
                        !selectedToken ||
                        !gasEstimation
                      }
                      className="btn-primary w-full py-2.5"
                    >
                      Review Transaction
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && selectedToken && (
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
                    <ArrowUpRightIcon
                      className="h-6 w-6 text-primary-600 dark:text-primary-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3
                      className="text-lg leading-6 font-medium text-slate-900 dark:text-white"
                      id="modal-title"
                    >
                      Confirm Transaction
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Please review your transaction details before sending
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6">
                  <div className="bg-slate-50 dark:bg-dark-700 rounded-md p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          From
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {formatAddress(wallet.address, 8, 6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          To
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {formatAddress(recipient, 8, 6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Amount
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {amount} {selectedToken.symbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Estimated Fee
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {gasEstimation?.estimatedFeeETH || "0"} ETH
                        </p>
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="mb-4 p-3 rounded-md bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800">
                      <div className="flex">
                        <ExclamationCircleIcon className="h-5 w-5 text-danger-400 dark:text-danger-500 mr-2" />
                        <p className="text-sm text-danger-700 dark:text-danger-400">
                          {errors.submit}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="sm:grid sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="btn-outline w-full"
                      onClick={() => setShowConfirmation(false)}
                      disabled={isSending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary w-full mt-3 sm:mt-0 relative"
                      onClick={handleConfirmSend}
                      disabled={isSending}
                    >
                      {isSending ? (
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
                          Sending...
                        </span>
                      ) : (
                        "Confirm & Send"
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

export default SendToken;
