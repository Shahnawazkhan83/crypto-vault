import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { WalletProvider } from "./contexts/WalletContext";
import { DarkModeProvider } from "./contexts/DarkModeProvider";
import useAuth from "./hooks/useAuth";

// Layout components
import MainLayout from "./components/layout/MainLayout";
import AuthLayout from "./components/layout/AuthLayout";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Dashboard pages
import Dashboard from "./pages/dashboard/Dashboard";
import about from "./pages/dashboard/about";

// Wallet pages
import WalletList from "./pages/wallet/WalletList";
import WalletDetail from "./pages/wallet/WalletDetail";
import SendToken from "./pages/wallet/SendToken";

// Swap pages
import Swap from "./pages/swap/Swap";

// Error pages
import NotFound from "./pages/NotFound";
import AboutPage from "./pages/dashboard/about";

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({
  element,
}) => {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return state.isAuthenticated ? (
    <>{element}</>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Public route component (redirects to dashboard if authenticated)
const PublicRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return state.isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <>{element}</>
  );
};

// App content component
const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/" element={<AuthLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<PublicRoute element={<Login />} />} />
          <Route
            path="register"
            element={<PublicRoute element={<Register />} />}
          />
        </Route>

        {/* Main app routes */}
        <Route path="/" element={<MainLayout />}>
          <Route
            path="dashboard"
            element={<ProtectedRoute element={<Dashboard />} />}
          />
          <Route
            path="about"
            element={<ProtectedRoute element={<AboutPage />} />}
          />

          {/* Wallet routes */}
          <Route
            path="wallets"
            element={<ProtectedRoute element={<WalletList />} />}
          />
          <Route
            path="wallets/:address"
            element={<ProtectedRoute element={<WalletDetail />} />}
          />
          <Route
            path="wallets/:address/send"
            element={<ProtectedRoute element={<SendToken />} />}
          />

          {/* Swap routes */}
          <Route path="swap" element={<ProtectedRoute element={<Swap />} />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

// Root App component with providers
const App: React.FC = () => {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <WalletProvider>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                iconTheme: {
                  primary: "#10B981",
                  secondary: "#FFFFFF",
                },
              },
              error: {
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#FFFFFF",
                },
              },
            }}
          />
        </WalletProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
};

export default App;
