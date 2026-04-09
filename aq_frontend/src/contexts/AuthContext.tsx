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

// decode the exp claim from a JWT without verifying the signature
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
  });

  // stored in a ref so getToken() is always stable
  const tokenRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAuth = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    tokenRef.current = null;
    setState({ user: null, accessToken: null, isLoading: false });
  }, []);

  const scheduleRefreshRef = useRef<(token: string) => void>(() => {});

  const setAuth = useCallback((token: string, user: AuthUser) => {
    tokenRef.current = token;
    setState({ user, accessToken: token, isLoading: false });
    scheduleRefreshRef.current(token);
  }, []);

  // Wire up scheduleRefresh
  useEffect(() => {
    scheduleRefreshRef.current = (token: string) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      const expiry = getTokenExpiry(token);
      if (!expiry) return;
      // Fire 60 s before expiry so there's always a valid token in flight.
      const delay = expiry - Date.now() - 60_000;
      if (delay <= 0) {
        // Token already expired or about to — refresh immediately.
        authApi.refreshTokens()
          .then((res) => setAuth(res.access_token, res.user))
          .catch(() => clearAuth());
        return;
      }
      refreshTimerRef.current = setTimeout(() => {
        authApi.refreshTokens()
          .then((res) => setAuth(res.access_token, res.user))
          .catch(() => clearAuth());
      }, delay);
    };
  }, [setAuth, clearAuth]);

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

  // Clean up the refresh timer on unmount
  useEffect(() => () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

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
