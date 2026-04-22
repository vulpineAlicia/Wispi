import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { getAvatar } from "../lib/avatars";
import { changePassword, deleteAccount } from "../api/authApi";
import { ApiError } from "../api/apiError";
import BaseButton from "../components/templates/BaseButton";
import Bubble from "../components/templates/Bubble";

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;

export default function Profile() {
  const { t } = useTranslation();
  const { user: nullableUser, signOut, getToken } = useAuth();
  const user = nullableUser!;
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

  const avatar = getAvatar(user.avatar_id);

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError(t('profile.newPasswordsMismatch'));
      return;
    }
    if (newPassword.length < 8) {
      setPwError(t('profile.newPasswordTooShort'));
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
      setPwError(err instanceof ApiError ? err.message : t('profile.somethingWentWrong'));
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== user.nickname) return;

    const token = getToken();
    if (!token) return;

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteAccount(token);
      await signOut();
      navigate("/");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : t('profile.somethingWentWrong'));
      setDeleteLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
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
          {t('profile.signOut')}
        </BaseButton>
      </Bubble>

      <Bubble tone="brand" className="mb-6 p-6">
        <h2 className="mb-4 text-base font-semibold text-brand-900">{t('profile.changePassword')}</h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <Bubble className="px-4 py-2.5">
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder={t('profile.currentPassword')}
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
              placeholder={t('profile.newPassword')}
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
              placeholder={t('profile.confirmNewPassword')}
              className="w-full bg-transparent text-sm text-brand-900/70 outline-none"
            />
          </Bubble>

          {pwError && (
            <Bubble tone="error" className="px-4 py-2 text-sm">{pwError}</Bubble>
          )}
          {pwSuccess && (
            <Bubble tone="brand" className="px-4 py-2 text-sm">{t('profile.passwordUpdated')}</Bubble>
          )}

          <BaseButton
            type="submit"
            disabled={pwLoading}
            className="w-full border border-transparent px-4 py-3 text-sm"
          >
            {pwLoading ? t('profile.saving') : t('profile.updatePassword')}
          </BaseButton>
        </form>

        {CONTACT_EMAIL && (
          <p className="mt-5 px-2 text-xs text-brand-500">
            {t('profile.forgotNickname')}{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-brand-700"
            >
              {t('profile.contactSupport')}
            </a>
          </p>
        )}
      </Bubble>

      <Bubble tone="error" className="p-6">
        <h2 className="mb-2 text-base font-semibold">{t('profile.deleteAccount')}</h2>
        <p className="mb-4 text-sm">
          {t('profile.deleteConfirm')}
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
          {deleteLoading ? t('profile.deleting') : t('profile.deleteMyAccount')}
        </button>
      </Bubble>
    </main>
  );
}
