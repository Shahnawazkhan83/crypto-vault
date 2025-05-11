import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowPathIcon,
  ArrowUpRightIcon,
  ClipboardDocumentIcon,
  ArrowsRightLeftIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { formatAddress, formatBalance } from "../../utils/formatters";
import useWallet from "../../hooks/useWallet";
import type { TokenBalance } from "../../types/wallet.types";

// QR Code component
const QRCode: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  address: string;
}> = ({ isOpen, onClose, address }) => {
  if (!isOpen) return null;

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

        <div className="inline-block align-bottom bg-white dark:bg-dark-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30">
              <QrCodeIcon
                className="h-6 w-6 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3
                className="text-lg leading-6 font-medium text-slate-900 dark:text-white"
                id="modal-title"
              >
                Wallet Address
              </h3>
              <div className="mt-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Scan this QR code to send funds to this wallet
                </p>
                <div className="p-2 bg-white rounded-lg inline-block">
                  {/* Placeholder for actual QR code - in a real app, use a QR code library */}
                  <div className="w-48 h-48 mx-auto border-2 border-slate-300 rounded-md flex items-center justify-center">
                    <div className="text-xs text-slate-500 px-2 text-center">
                      QR Code Placeholder for {formatAddress(address)}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-mono break-all">
                    {address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              className="btn-primary w-full"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TokenRow: React.FC<{ token: TokenBalance }> = ({ token }) => {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyAddress = () => {
    if (!token.address) return;
    navigator.clipboard.writeText(token.address);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-800/70">
      <div className="flex items-center space-x-3">
        {token.logoURI ? (
          <img
            src={token.logoURI}
            alt={token.symbol}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
              {token.symbol.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
              {token.name}
            </h3>
            <span className="ml-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {token.symbol}
            </span>
          </div>
          {token.address && (
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
              <span>{formatAddress(token.address)}</span>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="ml-1.5 text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                <span className="sr-only">Copy address</span>
              </button>
              {showCopied && (
                <span className="ml-1.5 text-xs text-success-500 dark:text-success-400">
                  Copied!
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-slate-900 dark:text-white">
          {formatBalance(token.balance, token.decimals)}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {token.error ? (
            <span className="text-danger-500">Error loading balance</span>
          ) : (
            <span>
              {parseInt(token.balance) > 0 ? (
                <span className="text-success-500">Available</span>
              ) : (
                <span>0</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const WalletDetail: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const { state, refreshBalances } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Get the wallet details
  const wallet = state.wallets.find((w) => w.address === address);
  const balances = state.balances[address || ""] || [];

  useEffect(() => {
    if (address && (!balances || balances.length === 0)) {
      refreshBalances(address);
    }
  }, [address, balances, refreshBalances]);

  const handleRefreshBalances = async () => {
    if (!address) return;
    setIsRefreshing(true);
    await refreshBalances(address);
    setIsRefreshing(false);
  };

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
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
      <div className="container-app">
        {/* Wallet Header */}
        <div className="mb-6">
          <Link
            to="/wallets"
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 mb-2 inline-block"
          >
            &larr; Back to Wallets
          </Link>
          <div className="bg-white dark:bg-dark-800 rounded-lg border border-slate-200 dark:border-dark-700 shadow-sm p-6">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {wallet.name}
                </h2>
                <div className="mt-1 flex items-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatAddress(wallet.address, 10, 8)}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="ml-1.5 text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    <span className="sr-only">Copy address</span>
                  </button>
                  {copySuccess && (
                    <span className="ml-1.5 text-xs text-success-500 dark:text-success-400">
                      Copied!
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
                <button
                  type="button"
                  onClick={() => setShowQRCode(true)}
                  className="btn-outline btn-sm flex items-center"
                >
                  <QrCodeIcon className="h-4 w-4 mr-1.5" />
                  Show QR Code
                </button>
                <button
                  type="button"
                  onClick={handleRefreshBalances}
                  disabled={isRefreshing}
                  className="btn-outline btn-sm flex items-center"
                >
                  <ArrowPathIcon
                    className={`h-4 w-4 mr-1.5 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
                <Link
                  to={`/wallets/${wallet.address}/send`}
                  className="btn-primary btn-sm flex items-center"
                >
                  <ArrowUpRightIcon className="h-4 w-4 mr-1.5" />
                  Send
                </Link>
                <Link
                  to="/swap"
                  className="btn-secondary btn-sm flex items-center"
                >
                  <ArrowsRightLeftIcon className="h-4 w-4 mr-1.5" />
                  Swap
                </Link>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 dark:border-dark-700 pt-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Created Date
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {new Date(wallet.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    ETH Balance
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {formatBalance(
                      balances.find((b) => b.symbol === "ETH")?.balance || "0",
                      18,
                      6
                    )}{" "}
                    ETH
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Total Tokens
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {balances.filter((b) => parseFloat(b.balance) > 0).length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Network
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white flex items-center">
                    <span className="h-2 w-2 rounded-full bg-success-500 mr-1.5"></span>
                    Ethereum Mainnet
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Token Balances */}
        <div className="bg-white dark:bg-dark-800 rounded-lg border border-slate-200 dark:border-dark-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-dark-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Token Balances
            </h3>
          </div>

          {state.isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Loading balances...
              </p>
            </div>
          ) : balances.length === 0 ? (
            <div className="text-center py-12">
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
                No tokens found
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                This wallet doesn't have any tokens yet.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleRefreshBalances}
                  disabled={isRefreshing}
                  className="btn-primary btn-md flex items-center mx-auto"
                >
                  <ArrowPathIcon
                    className={`h-4 w-4 mr-1.5 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh Balances
                </button>
              </div>
            </div>
          ) : (
            <div>
              {balances.map((token) => (
                <TokenRow key={token.symbol} token={token} />
              ))}
            </div>
          )}
        </div>
      </div>

      <QRCode
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        address={wallet.address}
      />
    </div>
  );
};

export default WalletDetail;
