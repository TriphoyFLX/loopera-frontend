export interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  createdAt?: string;
  created_at?: string;
  onboarding_completed?: boolean;
  avatar_url?: string | null;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}
