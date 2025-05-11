import api from "./api";
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "../types/auth.types";

const AuthService = {
  // Register a new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post("/auth/register", credentials);
    return response.data;
  },

  // Login a user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // Refresh the access token
  async refreshToken(
    refreshData: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> {
    const response = await api.post("/auth/refresh-token", refreshData);
    return response.data;
  },

  // Logout a user
  async logout(userId: string, refreshToken: string): Promise<void> {
    await api.post("/auth/logout", { userId, refreshToken });
  },

  // Store authentication data in local storage
  storeAuthData(authData: AuthResponse): void {
    localStorage.setItem("accessToken", authData.accessToken);
    localStorage.setItem("refreshToken", authData.refreshToken);
    localStorage.setItem("userId", authData.user.id);
    localStorage.setItem("user", JSON.stringify(authData.user));
  },

  // Clear authentication data from local storage
  clearAuthData(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem("accessToken");
  },

  // Get current user from local storage
  getCurrentUser(): any {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
};

export default AuthService;
