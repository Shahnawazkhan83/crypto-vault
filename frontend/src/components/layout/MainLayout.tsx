import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  WalletIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition, Menu } from "@headlessui/react";
import useAuth from "../../hooks/useAuth";
import useWallet from "../../hooks/useWallet";
import { formatAddress } from "../../utils/formatters";
import ThemeToggle from "../common/ThemeToggle";

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { state: authState, logout } = useAuth();
  const { state: walletState } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: ChartBarIcon },
    { name: "Wallets", href: "/wallets", icon: WalletIcon },
    { name: "Swap", href: "/swap", icon: ArrowsRightLeftIcon },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 transition-colors duration-300">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-dark-800/75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={React.Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-dark-800 pb-4 pt-5 transition-colors duration-300">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>

                <div className="flex flex-shrink-0 items-center px-4">
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <WalletIcon className="h-8 w-8 text-primary-600 dark:text-primary-500" />
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      CryptoVault
                    </span>
                  </Link>
                </div>

                <div className="mt-5 h-0 flex-1 overflow-y-auto">
                  <nav className="space-y-1 px-2">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          group flex items-center px-2 py-2 text-base font-medium rounded-lg transition-colors duration-200
                          ${
                            location.pathname.startsWith(item.href)
                              ? "bg-primary-500 text-white"
                              : "text-slate-600 hover:bg-primary-50 hover:text-primary-900 dark:text-slate-300 dark:hover:bg-dark-700"
                          }
                        `}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon
                          className={`
                            mr-4 h-6 w-6 flex-shrink-0 transition-colors duration-200
                            ${
                              location.pathname.startsWith(item.href)
                                ? "text-white"
                                : "text-slate-500 group-hover:text-primary-500 dark:text-slate-400"
                            }
                          `}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </div>

                {walletState.selectedWallet && (
                  <div className="border-t border-slate-200 dark:border-dark-700 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full p-2">
                        <WalletIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {walletState.selectedWallet.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatAddress(walletState.selectedWallet.address)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 transition-colors duration-300">
          <div className="flex flex-1 flex-col overflow-y-auto pb-4 pt-5">
            <div className="flex flex-shrink-0 items-center px-4">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <WalletIcon className="h-8 w-8 text-primary-600 dark:text-primary-500" />
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  CryptoVault
                </span>
              </Link>
            </div>

            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                    ${
                      location.pathname.startsWith(item.href)
                        ? "bg-primary-500 text-white"
                        : "text-slate-600 hover:bg-primary-50 hover:text-primary-900 dark:text-slate-300 dark:hover:bg-dark-700"
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200
                      ${
                        location.pathname.startsWith(item.href)
                          ? "text-white"
                          : "text-slate-500 group-hover:text-primary-500 dark:text-slate-400"
                      }
                    `}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {walletState.selectedWallet && (
            <div className="border-t border-slate-200 dark:border-dark-700 p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full p-2">
                  <WalletIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {walletState.selectedWallet.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {formatAddress(walletState.selectedWallet.address)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:pl-64">
        {/* Top navbar */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm transition-colors duration-300">
          <button
            type="button"
            className="border-r border-slate-200 dark:border-dark-700 px-4 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1"></div>

            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notification dropdown */}
              <button
                type="button"
                className="relative rounded-full p-1.5 text-slate-400 hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-200 
                          hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white dark:ring-dark-800"></span>
              </button>

              {/* Profile dropdown */}
              <Menu as="div" className="relative ml-3">
                <div>
                  <Menu.Button
                    className="relative flex max-w-xs items-center rounded-full p-1 text-sm 
                                       hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors
                                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800"
                  >
                    <span className="sr-only">Open user menu</span>
                    <UserCircleIcon
                      className="h-8 w-8 text-slate-400 dark:text-slate-300"
                      aria-hidden="true"
                    />
                  </Menu.Button>
                </div>
                <Transition
                  as={React.Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-dark-800 
                                       py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none
                                       border border-slate-200 dark:border-dark-700"
                  >
                    <div className="border-b border-slate-200 dark:border-dark-700 px-4 py-2">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {authState.user?.username}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {authState.user?.email}
                      </div>
                    </div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? "bg-slate-100 dark:bg-dark-700" : ""
                          } flex w-full items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 transition-colors`}
                        >
                          <ArrowRightOnRectangleIcon
                            className="mr-3 h-5 w-5 text-slate-400 dark:text-slate-500"
                            aria-hidden="true"
                          />
                          Logout
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
