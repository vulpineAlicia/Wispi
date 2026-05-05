import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import * as authApi from "../api/authApi";
import type { AuthUser } from "../api/authApi";
import { ApiError } from "../api/apiError";
import { AuthContext } from "./authContextDef";
import type { AuthContextValue, AuthState } from "./authContextDef";

const REFRESH_RETRY_DELAY_MS = 30_000;

// 401 means the refresh token is gone/invalid — only that should drop the session.
// Network errors and 5xx are transient; we retry instead of logging the user out.
function isAuthFailure(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

// safe to decode without signature verification — backend validates the token on every request
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

  // Ref to setAuth used inside the timer callback to avoid a circular dep
  const setAuthRef = useRef<(token: string, user: AuthUser) => void>(() => {});

  const scheduleRefresh = useCallback((token: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const expiry = getTokenExpiry(token);
    if (!expiry) return;
    // Fire 60 s before expiry so there's always a valid token in flight
    const delay = expiry - Date.now() - 60_000;
    const doRefresh = (isRetry = false) => {
      authApi.refreshTokens()
        .then((res) => {
          // signOut/clearAuth may have run while the request was in flight
          if (tokenRef.current === null) return;
          setAuthRef.current(res.access_token, res.user);
        })
        .catch((err) => {
          if (tokenRef.current === null) return;
          if (isAuthFailure(err)) {
            console.error("Scheduled token refresh: refresh token invalid, signing out:", err);
            clearAuth();
            return;
          }
          if (isRetry) {
            console.error("Scheduled token refresh failed twice, signing out:", err);
            clearAuth();
            return;
          }
          console.warn("Scheduled token refresh failed (transient), retrying:", err);
          refreshTimerRef.current = setTimeout(() => doRefresh(true), REFRESH_RETRY_DELAY_MS);
        });
    };
    if (delay <= 0) {
      doRefresh();
      return;
    }
    refreshTimerRef.current = setTimeout(() => doRefresh(), delay);
  }, [clearAuth]);

  const setAuth = useCallback((token: string, user: AuthUser) => {
    tokenRef.current = token;
    setState({ user, accessToken: token, isLoading: false });
    scheduleRefresh(token);
  }, [scheduleRefresh]);

  // Keep setAuthRef current so timer callbacks always invoke the latest setAuth.
  useEffect(() => {
    setAuthRef.current = setAuth;
  }, [setAuth]);

  // Attempt silent refresh on mount
  useEffect(() => {
    const controller = new AbortController();

    authApi
      .refreshTokens(controller.signal)
      .then((res) => setAuth(res.access_token, res.user))
      .catch((err) => { if (!controller.signal.aborted) { console.error("Initial token refresh failed:", err); clearAuth(); } });

    return () => controller.abort();
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
    await authApi.logout().catch((err) => console.error("Logout request failed:", err));
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
