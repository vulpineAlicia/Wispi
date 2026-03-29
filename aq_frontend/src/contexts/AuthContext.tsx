import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import * as authApi from "../lib/services/authApi";
import type { AuthUser } from "../lib/services/authApi";
import { AuthContext } from "./authContextDef";
import type { AuthContextValue } from "./authContextDef";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
  });

  const tokenRef = useRef<string | null>(null);

  const setAuth = useCallback((token: string, user: AuthUser) => {
    tokenRef.current = token;
    setState({ user, accessToken: token, isLoading: false });
  }, []);

  const clearAuth = useCallback(() => {
    tokenRef.current = null;
    setState({ user: null, accessToken: null, isLoading: false });
  }, []);

  // Attempt silent refresh on mount
  useEffect(() => {
    let cancelled = false;

    authApi
      .refreshTokens()
      .then((res) => {
        if (!cancelled) setAuth(res.access_token, res.user);
      })
      .catch(() => {
        if (!cancelled) clearAuth();
      });

    return () => {
      cancelled = true;
    };
  }, [setAuth, clearAuth]);

  const signIn = useCallback(
    async (nickname: string, password: string) => {
      const res = await authApi.login(nickname, password);
      setAuth(res.access_token, res.user);
    },
    [setAuth]
  );

  const register = useCallback(
    async (password: string): Promise<AuthUser> => {
      const res = await authApi.register(password);
      setAuth(res.access_token, res.user);
      return res.user;
    },
    [setAuth]
  );

  const signOut = useCallback(async () => {
    await authApi.logout().catch(() => {});
    clearAuth();
  }, [clearAuth]);

  const getToken = useCallback(() => tokenRef.current, []);

  const value: AuthContextValue = {
    ...state,
    signIn,
    register,
    signOut,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
