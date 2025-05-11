import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  WalletIcon,
  ArrowsRightLeftIcon,
  ArrowUpRightIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  KeyIcon,
  LockClosedIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useWallet from "../../hooks/useWallet";
import useAuth from "../../hooks/useAuth";
import { formatAddress, formatBalance } from "../../utils/formatters";
import type { TokenBalance } from "../../types/wallet.types";

// Mock data for portfolio chart
const portfolioData = [
  { date: "Jan 01", value: 3400 },
  { date: "Jan 08", value: 2800 },
  { date: "Jan 15", value: 3200 },
  { date: "Jan 22", value: 4300 },
  { date: "Jan 29", value: 4600 },
  { date: "Feb 06", value: 4900 },
  { date: "Feb 13", value: 4700 },
  { date: "Feb 20", value: 5300 },
  { date: "Feb 27", value: 5700 },
  { date: "Mar 03", value: 6000 },
  { date: "Mar 10", value: 6400 },
  { date: "Apr 17", value: 6800 },
  { date: "Apr 24", value: 6300 },
  { date: "May 10", value: 6900 },
];

// Transaction activity
const recentTransactions = [
  {
    id: 1,
    type: "Received",
    token: "ETH",
    amount: "0.15",
    from: "0x3F4a354c8b393586703E54b49391A7D4B1D33757",
    to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    date: "may 10, 2025",
  },
  {
    id: 2,
    type: "Sent",
    token: "USDT",
    amount: "250",
    from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    to: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    date: "may 10, 2025",
  },
  {
    id: 3,
    type: "Swap",
    token: "ETH → USDC",
    amount: "0.5 → 975.25",
    from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    date: "may 11, 2025",
  },
];

// Security features
const securityFeatures = [
  {
    title: "Advanced Encryption",
    description:
      "Your private keys are protected with AWS KMS or AES-256-GCM encryption",
    icon: LockClosedIcon,
    color:
      "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400",
  },
  {
    title: "Secure Key Management",
    description:
      "Keys are never stored in plain text and are cleared from memory when not in use",
    icon: KeyIcon,
    color:
      "bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400",
  },
  {
    title: "Enhanced Authentication",
    description:
      "JWT tokens with rotation, refresh token security, and replay attack prevention",
    icon: ShieldCheckIcon,
    color:
      "bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400",
  },
  {
    title: "Secure Architecture",
    description:
      "Layered design with separated concerns for maximum security and reliability",
    icon: ServerIcon,
    color:
      "bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400",
  },
];

const Dashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const { state: walletState, refreshBalances, generateWallet } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  // Calculate total value based on walletState.balances
  const calculateTotalValue = useCallback(() => {
    // In a real app, you would calculate the total value based on token prices
    // For this demo, we'll just use mock values
    let total = 0;

    // Add up the value of tokens in each wallet
    Object.values(walletState.balances).forEach((tokenBalances) => {
      tokenBalances.forEach((token) => {
        const balance = parseFloat(token.balance);
        if (!isNaN(balance)) {
          if (token.symbol === "ETH") {
            total += balance * 2400; // Mock ETH price in USD
          } else if (
            token.symbol === "USDT" ||
            token.symbol === "USDC" ||
            token.symbol === "DAI"
          ) {
            total += balance; // Stablecoins
          } else if (token.symbol === "WBTC") {
            total += balance * 63000; // Mock BTC price in USD
          } else {
            total += balance * 10; // Other tokens (mock value)
          }
        }
      });
    });

    setTotalValue(total);
  }, [walletState.balances]);

  // Run calculateTotalValue when balances change
  useEffect(() => {
    calculateTotalValue();
  }, [calculateTotalValue]);

  const handleRefreshBalances = async () => {
    if (walletState.selectedWallet) {
      setIsRefreshing(true);
      await refreshBalances(walletState.selectedWallet.address);
      setIsRefreshing(false);
    }
  };

  const handleCreateWallet = async () => {
    setIsCreatingWallet(true);
    await generateWallet(`${authState.user?.username}'s Wallet`);
    setIsCreatingWallet(false);
  };

  const getTopTokens = (): TokenBalance[] => {
    if (
      !walletState.selectedWallet ||
      !walletState.balances[walletState.selectedWallet.address]
    ) {
      return [];
    }

    return [...walletState.balances[walletState.selectedWallet.address]]
      .sort((a, b) => {
        // Sort by non-zero balances first, then by balance value
        const aValue = parseFloat(a.balance);
        const bValue = parseFloat(b.balance);

        if (aValue === 0 && bValue === 0) return 0;
        if (aValue === 0) return 1;
        if (bValue === 0) return -1;

        return bValue - aValue;
      })
      .slice(0, 5);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:truncate sm:tracking-tight">
              Welcome back, {authState.user?.username}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage your crypto portfolio, send tokens, and swap between assets
              with enterprise-grade security.
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            <button
              type="button"
              onClick={handleRefreshBalances}
              disabled={isRefreshing || !walletState.selectedWallet}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-dark-600 dark:bg-transparent dark:text-slate-300 dark:hover:bg-dark-700 transition-colors"
            >
              <ArrowPathIcon
                className={`h-4 w-4 mr-1.5 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleCreateWallet}
              disabled={isCreatingWallet}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
            >
              {isCreatingWallet ? (
                <>
                  <svg
                    className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-white"
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
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircleIcon className="h-4 w-4 mr-1.5" />
                  Create Wallet
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Portfolio Value */}
          <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl shadow-sm col-span-1 sm:col-span-2 lg:col-span-2 overflow-hidden animate-fade-in">
            <div className="p-6 pb-2">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                Portfolio Value
              </h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">
                  $
                  {totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="ml-2 text-sm font-medium text-success-500 dark:text-success-400 flex items-center">
                  <ArrowUpRightIcon className="inline h-4 w-4 mr-0.5" />
                  8.2%
                </p>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Last 90 days
              </p>
            </div>
            <div className="h-64 px-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={portfolioData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F0"
                    className="dark:stroke-dark-600"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748B" }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={{ stroke: "#E2E8F0" }}
                    className="dark:text-slate-400 dark:stroke-dark-600"
                  />
                  <YAxis
                    tick={{ fill: "#64748B" }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={{ stroke: "#E2E8F0" }}
                    tickFormatter={(value) => `$${value}`}
                    className="dark:text-slate-400 dark:stroke-dark-600"
                  />
                  <Tooltip
                    formatter={(value: any) => [`$${value}`, "Value"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0EA5E9"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Wallet Info */}
          <div
            className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl shadow-sm col-span-1 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                Wallet Summary
              </h3>

              {walletState.selectedWallet ? (
                <div className="mt-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Current Wallet
                  </p>
                  <div className="mt-1 flex items-center">
                    <div className="bg-primary-100 dark:bg-primary-800/40 rounded-full p-2">
                      <WalletIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {walletState.selectedWallet.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatAddress(walletState.selectedWallet.address)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        Total Wallets
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {walletState.wallets.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                      Top Tokens
                    </h4>
                    <div className="space-y-3">
                      {getTopTokens().map((token) => (
                        <div
                          key={token.symbol}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            {token.logoURI ? (
                              <img
                                src={token.logoURI}
                                alt={token.symbol}
                                className="h-6 w-6 rounded-full"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                  {token.symbol.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="ml-2 text-sm font-medium text-slate-900 dark:text-white">
                              {token.symbol}
                            </span>
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {formatBalance(token.balance, token.decimals)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Link
                      to={`/wallets/${walletState.selectedWallet.address}`}
                      className="inline-flex justify-center items-center px-3 py-1.5 text-sm font-medium rounded-lg
                               border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 
                               dark:border-dark-600 dark:bg-transparent dark:text-slate-300 dark:hover:bg-dark-700 
                               transition-colors shadow-sm"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/wallets/${walletState.selectedWallet.address}/send`}
                      className="inline-flex justify-center items-center px-3 py-1.5 text-sm font-medium rounded-lg
                               bg-primary-600 text-white hover:bg-primary-700 
                               dark:bg-primary-500 dark:hover:bg-primary-600
                               transition-colors shadow-sm"
                    >
                      Send
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-center py-6">
                  <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center">
                    <WalletIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    No wallets
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Get started by creating a new wallet.
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleCreateWallet}
                      disabled={isCreatingWallet}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg
                               bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
                    >
                      {isCreatingWallet ? "Creating..." : "Create Wallet"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl shadow-sm col-span-1 sm:col-span-1 lg:col-span-1 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                Quick Actions
              </h3>
              <div className="mt-4 divide-y divide-slate-200 dark:divide-dark-700">
                <Link
                  to="/wallets"
                  className="flex items-center py-3 hover:bg-slate-50 dark:hover:bg-dark-700 -mx-6 px-6 transition-colors duration-150"
                >
                  <div className="bg-primary-100 dark:bg-primary-800/40 rounded-full p-2">
                    <WalletIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Manage Wallets
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      View and create crypto wallets
                    </p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-slate-400" />
                </Link>

                <Link
                  to="/swap"
                  className="flex items-center py-3 hover:bg-slate-50 dark:hover:bg-dark-700 -mx-6 px-6 transition-colors duration-150"
                >
                  <div className="bg-secondary-100 dark:bg-secondary-800/40 rounded-full p-2">
                    <ArrowsRightLeftIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Swap Tokens
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Exchange between different cryptocurrencies
                    </p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-slate-400" />
                </Link>

                {walletState.selectedWallet && (
                  <Link
                    to={`/wallets/${walletState.selectedWallet.address}/send`}
                    className="flex items-center py-3 hover:bg-slate-50 dark:hover:bg-dark-700 -mx-6 px-6 transition-colors duration-150"
                  >
                    <div className="bg-success-100 dark:bg-success-800/40 rounded-full p-2">
                      <ArrowUpRightIcon className="h-5 w-5 text-success-600 dark:text-success-400" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Send Tokens
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Transfer crypto to another address
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-slate-400" />
                  </Link>
                )}

                <Link
                  to="/about"
                  className="flex items-center py-3 hover:bg-slate-50 dark:hover:bg-dark-700 -mx-6 px-6 transition-colors duration-150"
                >
                  <div className="bg-warning-100 dark:bg-warning-800/40 rounded-full p-2">
                    <ShieldCheckIcon className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Learn About Security
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Discover how your assets are protected
                    </p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* Security Features Section */}
          <div
            className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl shadow-sm col-span-1 sm:col-span-2 lg:col-span-3 animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                  Enterprise-Grade Security
                </h3>
                <button
                  onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {showSecurityInfo ? "Hide details" : "Learn more"}
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {securityFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div
                      className={`inline-flex rounded-lg p-3 ${feature.color}`}
                    >
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              {showSecurityInfo && (
                <div className="mt-6 bg-slate-50 dark:bg-dark-700 rounded-lg p-6 animate-fade-in">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                    How We Protect Your Assets
                  </h4>

                  <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                    <p>
                      <span className="font-medium">
                        Advanced Key Encryption:
                      </span>{" "}
                      Your private keys are never stored in plaintext. We use a
                      hybrid encryption approach with either AWS KMS (FIPS 140-2
                      compliant) or AES-256-GCM with a secure key derivation
                      function.
                    </p>

                    <p>
                      <span className="font-medium">Memory Management:</span>{" "}
                      Private keys are cached for minimal time periods (60
                      seconds) and references to sensitive data are cleared from
                      memory when no longer needed.
                    </p>

                    <p>
                      <span className="font-medium">
                        Secure Authentication:
                      </span>{" "}
                      Our system employs JWT tokens with short expiry (1 hour),
                      refresh token rotation on use to prevent token reuse, and
                      JTI (JWT ID) tracking to prevent replay attacks.
                    </p>

                    <p>
                      <span className="font-medium">Secure Architecture:</span>{" "}
                      Our backend uses a layered architecture with separation of
                      concerns, ensuring that even if one layer is compromised,
                      your assets remain protected.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      to="/about"
                      className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
                    >
                      View detailed security information
                      <ChevronRightIcon className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl shadow-sm col-span-1 sm:col-span-2 lg:col-span-3 animate-fade-in"
            style={{ animationDelay: "400ms" }}
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                Recent Activity
              </h3>

              <div className="mt-4 overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-dark-700">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-white sm:pl-6"
                        >
                          Type
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white"
                        >
                          Token
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white"
                        >
                          Amount
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white"
                        >
                          From/To
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white"
                        >
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-dark-700">
                      {recentTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors"
                        >
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                ${
                                  transaction.type === "Received"
                                    ? "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300"
                                    : transaction.type === "Sent"
                                    ? "bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300"
                                    : "bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300"
                                }
                              `}
                            >
                              {transaction.type}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 dark:text-slate-200">
                            {transaction.token}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 dark:text-slate-200">
                            {transaction.amount}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                            {formatAddress(
                              transaction.type === "Received"
                                ? transaction.from
                                : transaction.to
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                            {transaction.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  View all transactions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
