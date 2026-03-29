import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { getAvatar } from "../lib/avatars";
import { changePassword, deleteAccount } from "../lib/services/authApi";
import { ApiError } from "../lib/services/apiError";
import BaseButton from "../components/templates/BaseButton";
import Bubble from "../components/templates/Bubble";

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;

export default function Profile() {
  const { user, signOut, getToken } = useAuth();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center text-brand-700">
        You are not signed in.{" "}
        <button
          type="button"
          onClick={() => navigate("/auth")}
          className="underline hover:text-brand-900"
        >
          Sign in
        </button>
      </main>
    );
  }

  const avatar = getAvatar(user.avatar_id);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }

    const token = getToken();
    if (!token) return;

    setPwLoading(true);
    try {
      await changePassword(oldPassword, newPassword, token);
      setPwSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== user!.nickname) return;

    const token = getToken();
    if (!token) return;

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteAccount(token);
      await signOut();
      navigate("/");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Something went wrong.");
      setDeleteLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      {/* Avatar + nickname */}
      <Bubble tone="brand" className="mb-6 flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${avatar.bg} ${avatar.ring}`}
          >
            {avatar.emoji}
          </div>
          <p className="text-lg font-semibold text-brand-900">{user.nickname}</p>
        </div>
        <BaseButton type="button" onClick={handleSignOut} className="px-5 py-3 text-sm">
          Sign out
        </BaseButton>
      </Bubble>

      {/* Change password */}
      <Bubble tone="brand" className="mb-6 p-6">
        <h2 className="mb-4 text-base font-semibold text-brand-900">Change password</h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <Bubble className="px-4 py-2.5">
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Current password"
              className="w-full bg-transparent text-sm text-brand-900/70 outline-none"
            />
          </Bubble>
          <Bubble className="px-4 py-2.5">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="New password"
              className="w-full bg-transparent text-sm text-brand-900/70 outline-none"
            />
          </Bubble>
          <Bubble className="px-4 py-2.5">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Confirm new password"
              className="w-full bg-transparent text-sm text-brand-900/70 outline-none"
            />
          </Bubble>

          {pwError && (
            <Bubble tone="error" className="px-4 py-2 text-sm">{pwError}</Bubble>
          )}
          {pwSuccess && (
            <Bubble tone="brand" className="px-4 py-2 text-sm">Password updated.</Bubble>
          )}

          <BaseButton
            type="submit"
            disabled={pwLoading}
            className="w-full border border-transparent px-4 py-3 text-sm"
          >
            {pwLoading ? "Saving…" : "Update password"}
          </BaseButton>
        </form>

        {CONTACT_EMAIL && (
          <p className="mt-5 px-2 text-xs text-brand-500">
            Forgot your nickname or locked out?{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-brand-700"
            >
              Contact support
            </a>
          </p>
        )}
      </Bubble>

      {/* Delete account */}
      <Bubble tone="error" className="p-6">
        <h2 className="mb-2 text-base font-semibold">Delete account</h2>
        <p className="mb-4 text-sm">
          This is permanent. Type your nickname to confirm.
        </p>
        <Bubble tone="error" className="mb-3 px-4 py-2.5 bg-white">
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={user.nickname}
            className="w-full bg-transparent text-sm text-rose-900/70 outline-none placeholder:opacity-50"
          />
        </Bubble>

        {deleteError && (
          <Bubble tone="error" className="mb-3 px-4 py-2 text-sm">{deleteError}</Bubble>
        )}

        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== user.nickname || deleteLoading}
          className="rounded-3xl bg-rose-900 px-4 py-2.5 text-sm font-medium text-rose-50 transition hover:bg-rose-800"
        >
          {deleteLoading ? "Deleting…" : "Delete my account"}
        </button>
      </Bubble>
    </main>
  );
}
