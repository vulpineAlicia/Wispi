import { deleteJson, getJson, postJson } from "./apiClient";
import type { AuthUser, TokenResponse } from "./authTypes";

export type { AuthUser, TokenResponse };

export async function register(password: string): Promise<TokenResponse> {
  return postJson<TokenResponse>("/auth/register", { password });
}

export async function login(nickname: string, password: string): Promise<TokenResponse> {
  return postJson<TokenResponse>("/auth/login", { nickname, password });
}

export async function refreshTokens(signal?: AbortSignal): Promise<TokenResponse> {
  return postJson<TokenResponse>("/auth/refresh", undefined, { signal });
}

export async function logout(): Promise<void> {
  await postJson<unknown>("/auth/logout");
}

export async function getMe(accessToken: string): Promise<AuthUser> {
  return getJson<AuthUser>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
  accessToken: string
): Promise<void> {
  await postJson<unknown>(
    "/auth/change-password",
    { old_password: oldPassword, new_password: newPassword },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

export async function deleteAccount(accessToken: string): Promise<void> {
  await deleteJson<unknown>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
