import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  WalletIcon,
  PlusCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { formatAddress, formatBalance } from "../../utils/formatters";
import useWallet from "../../hooks/useWallet";
import type { Wallet as WalletType } from "../../types/wallet.types";

const WalletItem: React.FC<{
  wallet: WalletType;
  isActive: boolean;
  onSelect: (wallet: WalletType) => void;
}> = ({ wallet, isActive, onSelect }) => {
  const { state, refreshBalances } = useWallet();
  const [copySuccess, setCopySuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const balances = state.balances[wallet.address] || [];

  // Get total value in ETH (simplified, in a real app you'd convert to a common currency)
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
      className={`group relative rounded-lg border p-4 hover:shadow-md transition-all duration-150 cursor-pointer ${
        isActive
          ? "border-primary-300 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20"
          : "border-slate-200 bg-white hover:border-primary-200 dark:border-dark-700 dark:hover:border-primary-900 dark:bg-dark-800"
      }`}
      onClick={() => onSelect(wallet)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div
            className={`rounded-full p-2 ${
              isActive
                ? "bg-primary-100 dark:bg-primary-800/40"
                : "bg-slate-100 dark:bg-dark-700"
            }`}
          >
            <WalletIcon
              className={`h-5 w-5 ${
                isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
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
                className="ml-1.5 text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                <span className="sr-only">Copy address</span>
              </button>
              {copySuccess && (
                <span className="ml-1.5 text-xs text-success-500 dark:text-success-400">
                  Copied!
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={handleRefresh}
            className={`p-1.5 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-400 dark:hover:bg-dark-700 ${
              isRefreshing ? "animate-spin" : ""
            }`}
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
          className="btn-outline btn-sm flex-1 flex justify-center text-xs"
        >
          View Details
        </Link>
        <Link
          to={`/wallets/${wallet.address}/send`}
          className="btn-primary btn-sm flex-1 flex justify-center text-xs"
        >
          Send
        </Link>
      </div>
    </div>
  );
};

const CreateWalletModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isCreating: boolean;
}> = ({ isOpen, onClose, onSubmit, isCreating }) => {
  const [walletName, setWalletName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(walletName);
  };

  return (
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
          onClick={onClose}
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
              <WalletIcon
                className="h-6 w-6 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3
                className="text-lg leading-6 font-medium text-slate-900 dark:text-white"
                id="modal-title"
              >
                Create a New Wallet
              </h3>
              <div className="mt-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Create a new secure wallet to store your cryptocurrencies.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 sm:mt-6">
            <div>
              <label htmlFor="wallet-name" className="form-label">
                Wallet Name
              </label>
              <input
                type="text"
                name="wallet-name"
                id="wallet-name"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="input-primary"
                placeholder="My Wallet"
                required
              />
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                className="btn-outline w-full"
                onClick={onClose}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary w-full mt-3 sm:mt-0 relative"
                disabled={isCreating || !walletName.trim()}
              >
                {isCreating ? (
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
                    Creating...
                  </span>
                ) : (
                  "Create Wallet"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const WalletList: React.FC = () => {
  const { state, selectWallet, generateWallet } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWallet = async (name: string) => {
    setIsCreating(true);
    await generateWallet(name);
    setIsCreating(false);
    setIsModalOpen(false);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:truncate sm:tracking-tight">
              My Wallets
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View and manage your Ethereum wallets.
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn-primary btn-md flex items-center"
            >
              <PlusCircleIcon className="h-4 w-4 mr-1.5" />
              Create Wallet
            </button>
          </div>
        </div>

        {state.isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Loading wallets...
            </p>
          </div>
        ) : state.wallets.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-lg border border-slate-200 dark:border-dark-700 shadow-sm">
            <WalletIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              No wallets
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Get started by creating a new wallet.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="btn-primary btn-md"
              >
                <PlusCircleIcon className="h-4 w-4 mr-1.5" />
                Create Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {state.wallets.map((wallet) => (
              <WalletItem
                key={wallet.address}
                wallet={wallet}
                isActive={state.selectedWallet?.address === wallet.address}
                onSelect={selectWallet}
              />
            ))}
          </div>
        )}
      </div>

      <CreateWalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateWallet}
        isCreating={isCreating}
      />
    </div>
  );
};

export default WalletList;
