import React from "react";
import { Outlet, Link } from "react-router-dom";
import { WalletIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "../common/ThemeToggle";

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-full">
            <WalletIcon className="h-14 w-14 text-primary-600 dark:text-primary-500" />
          </div>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          CryptoVault
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Secure Multi-Crypto Wallet System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className="bg-white border border-slate-200 py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 
                       dark:bg-dark-800 dark:border-dark-700 animate-scale-in"
        >
          <Outlet />
        </div>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            Build with ❤️ By Shahnawaz Khan
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
