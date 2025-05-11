import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  LockClosedIcon,
  EnvelopeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import useAuth from "../../hooks/useAuth";
import {
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
} from "../../utils/validators";

const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, state } = useAuth();

  const passwordStrength = getPasswordStrength(password);

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
        return "bg-danger-500";
      case 1:
        return "bg-danger-500";
      case 2:
        return "bg-warning-500";
      case 3:
        return "bg-success-400";
      case 4:
        return "bg-success-500";
      default:
        return "bg-slate-300 dark:bg-dark-600";
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!username) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!isValidPassword(password)) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await register({ email, password, username });
  };

  return (
    <div>
      <h3 className="text-center text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Create a new account
      </h3>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`input-primary pl-10 ${
                errors.username
                  ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500"
                  : ""
              }`}
              placeholder="johndoe"
            />
          </div>
          {errors.username && <p className="form-error">{errors.username}</p>}
        </div>

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
              autoComplete="new-password"
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

          {password && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Password strength:
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: getPasswordStrengthColor() }}
                >
                  {getPasswordStrengthText()}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getPasswordStrengthColor()}`}
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon
                className="h-5 w-5 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`input-primary pl-10 ${
                errors.confirmPassword
                  ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500"
                  : ""
              }`}
              placeholder="••••••••"
            />
          </div>
          {errors.confirmPassword && (
            <p className="form-error">{errors.confirmPassword}</p>
          )}
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
                Registering...
              </span>
            ) : (
              "Create account"
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
              Already have an account?
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Link to="/login" className="btn btn-outline w-full py-2.5">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
