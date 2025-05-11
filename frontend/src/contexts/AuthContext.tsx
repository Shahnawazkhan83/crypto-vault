import React, { createContext, useReducer, useEffect } from "react";
import type {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../types/auth.types";
import AuthService from "../services/authService";
import toast from "react-hot-toast";

// Define the auth context type
interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the auth context with a default value
export const AuthContext = createContext<AuthContextType>({
  state: {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  },
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

// Define action types
type AuthAction =
  | { type: "LOGIN_REQUEST" }
  | {
      type: "LOGIN_SUCCESS";
      payload: { user: User; accessToken: string; refreshToken: string };
    }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "REGISTER_REQUEST" }
  | {
      type: "REGISTER_SUCCESS";
      payload: { user: User; accessToken: string; refreshToken: string };
    }
  | { type: "REGISTER_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | {
      type: "INITIALIZE";
      payload: {
        user: User | null;
        accessToken: string | null;
        refreshToken: string | null;
      };
    };

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_REQUEST":
    case "REGISTER_REQUEST":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        error: null,
      };
    case "LOGIN_FAILURE":
    case "REGISTER_FAILURE":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
      };
    case "INITIALIZE":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: !!action.payload.user,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      };
    default:
      return state;
  }
};

// Initial auth state
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from local storage
  useEffect(() => {
    const initializeAuth = () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const userStr = localStorage.getItem("user");
      let user: User | null = null;

      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch (error) {
          console.error("Failed to parse user from localStorage");
        }
      }

      dispatch({
        type: "INITIALIZE",
        payload: { user, accessToken, refreshToken },
      });
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: "LOGIN_REQUEST" });
    try {
      const data = await AuthService.login(credentials);

      // Store auth data in local storage
      AuthService.storeAuthData(data);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
      });

      toast.success("Login successful!");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to login";
      dispatch({ type: "LOGIN_FAILURE", payload: message });
      toast.error(message);
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: "REGISTER_REQUEST" });
    try {
      const data = await AuthService.register(credentials);

      // Store auth data in local storage
      AuthService.storeAuthData(data);

      dispatch({
        type: "REGISTER_SUCCESS",
        payload: {
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
      });

      toast.success("Registration successful!");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to register";
      dispatch({ type: "REGISTER_FAILURE", payload: message });
      toast.error(message);
    }
  };

  // Logout function
  const logout = async () => {
    if (state.user?.id && state.refreshToken) {
      try {
        await AuthService.logout(state.user.id, state.refreshToken);
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }

    // Clear auth data from local storage
    AuthService.clearAuthData();

    dispatch({ type: "LOGOUT" });
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
