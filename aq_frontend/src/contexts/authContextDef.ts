import { createContext } from "react";
import type { AuthUser } from "../api/authApi";

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
};

export type AuthContextValue = AuthState & {
  signIn: (nickname: string, password: string) => Promise<void>;
  register: (password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  getToken: () => string | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
