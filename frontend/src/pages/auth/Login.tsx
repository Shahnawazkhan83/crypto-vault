import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LockClosedIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import useAuth from "../../hooks/useAuth";
import { isValidEmail } from "../../utils/validators";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, state } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await login({ email, password });
  };

  return (
    <div>
      <h3 className="text-center text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Sign in to your account
      </h3>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon
                className="h-5 w-5 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input-primary pl-10 ${
                errors.email
                  ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500"
                  : ""
              }`}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon
                className="h-5 w-5 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input-primary pl-10 ${
                errors.password
                  ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500"
                  : ""
              }`}
              placeholder="••••••••"
            />
          </div>
          {errors.password && <p className="form-error">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded dark:border-dark-600 dark:bg-dark-700"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-slate-900 dark:text-slate-300"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a
              href="#"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={state.isLoading}
            className="btn-primary w-full py-2.5 relative"
          >
            {state.isLoading ? (
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
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </div>
      </form>

      {state.error && (
        <div className="mt-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-md p-3">
          <p className="text-sm text-danger-700 dark:text-danger-400">
            {state.error}
          </p>
        </div>
      )}

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300 dark:border-dark-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-dark-800 text-slate-500 dark:text-slate-400">
              Don't have an account?
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Link to="/register" className="btn btn-outline w-full py-2.5">
            Create a new account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
