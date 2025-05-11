export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  refreshJti?: string;
}

export interface RefreshTokenRequest {
  userId: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  refreshJti: string;
}
