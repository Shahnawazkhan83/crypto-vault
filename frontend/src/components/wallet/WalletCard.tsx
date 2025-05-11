import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  WalletIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { formatAddress, formatBalance } from "../../utils/formatters";
import useWallet from "../../hooks/useWallet";
import type { Wallet as WalletType } from "../../types/wallet.types";

interface WalletCardProps {
  wallet: WalletType;
  isActive: boolean;
  onSelect: (wallet: WalletType) => void;
}

const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  isActive,
  onSelect,
}) => {
  const { state, refreshBalances } = useWallet();
  const [copySuccess, setCopySuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const balances = state.balances[wallet.address] || [];
  const ethBalance = balances.find((b) => b.symbol === "ETH")?.balance || "0";

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(wallet.address);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await refreshBalances(wallet.address);
    setIsRefreshing(false);
  };

  return (
    <div
      onClick={() => onSelect(wallet)}
      className={`
        relative rounded-lg border p-4 transition-all duration-200 cursor-pointer hover:shadow-md
        ${
          isActive
            ? "border-primary-300 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20"
            : "border-slate-200 bg-white hover:border-primary-200 dark:border-dark-700 dark:bg-dark-800 dark:hover:border-primary-900"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div
            className={`
              rounded-full p-2 
              ${
                isActive
                  ? "bg-primary-100 dark:bg-primary-800/40"
                  : "bg-slate-100 dark:bg-dark-700"
              }
            `}
          >
            <WalletIcon
              className={`
                h-5 w-5 
                ${
                  isActive
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-500 dark:text-slate-400"
                }
              `}
            />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
              {wallet.name}
            </h3>
            <div className="mt-1 flex items-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatAddress(wallet.address)}
              </p>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="ml-1.5 text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 transition-colors"
                aria-label="Copy address"
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
              </button>
              {copySuccess && (
                <span className="ml-1.5 text-xs text-success-500 dark:text-success-400 animate-fade-in">
                  Copied!
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={handleRefresh}
            className={`
              p-1.5 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-100 
              dark:text-slate-500 dark:hover:text-slate-400 dark:hover:bg-dark-700 
              transition-colors
              ${isRefreshing ? "animate-spin" : ""}
            `}
            aria-label="Refresh balance"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          <ChevronRightIcon className="h-5 w-5 text-slate-400 ml-1" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ETH Balance
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {formatBalance(ethBalance, 18, 6)} ETH
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {new Date(wallet.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <Link
          to={`/wallets/${wallet.address}`}
          className="inline-flex justify-center items-center px-3 py-1.5 text-xs font-medium rounded-lg
                   border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 
                   dark:border-dark-600 dark:bg-transparent dark:text-slate-300 dark:hover:bg-dark-700 
                   transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500
                   flex-1"
        >
          View Details
        </Link>
        <Link
          to={`/wallets/${wallet.address}/send`}
          className="inline-flex justify-center items-center px-3 py-1.5 text-xs font-medium rounded-lg
                   bg-primary-600 text-white hover:bg-primary-700 
                   dark:bg-primary-500 dark:hover:bg-primary-600
                   transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500
                   flex-1"
        >
          Send
        </Link>
      </div>
    </div>
  );
};

export default WalletCard;
