import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { getAvatar } from "../lib/avatars";
import { getUserMessage } from "../api/apiMessages";
import BaseButton from "../components/templates/BaseButton";
import Bubble from "../components/templates/Bubble";

type Mode = "login" | "register";

export default function Auth() {
  const { t } = useTranslation();
  const { signIn, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [newUser, setNewUser] = useState<{ nickname: string; avatarId: number } | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirm("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      if (password !== confirm) {
        setError(t('auth.passwordsMismatch'));
        return;
      }
      if (password.length < 8) {
        setError(t('auth.passwordTooShort'));
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(nickname, password);
        navigate("/");
      } else {
        const user = await register(password);
        setNewUser({ nickname: user.nickname, avatarId: user.avatar_id });
      }
    } catch (err) {
      setError(getUserMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (newUser) {
    const avatar = getAvatar(newUser.avatarId);
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <Bubble className="p-8 text-center">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${avatar.bg} ${avatar.ring}`}
          >
            {avatar.emoji}
          </div>
          <h1 className="mb-2 text-base text-brand-900">{t('auth.successTitle')}</h1>
          <p className="mb-1 text-base text-brand-900">{t('auth.nicknameLabel')}</p>
          <p className="mb-6 text-2xl font-bold text-brand-900">{newUser.nickname}</p>
          <p className="mb-6 text-base text-brand-900">
            {t('auth.saveHint')}
          </p>
          <BaseButton to="/" className="block w-full px-4 py-2.5 text-sm text-center">
            {t('auth.goHome')}
          </BaseButton>
        </Bubble>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Bubble className="p-8">
        <div className="mb-6 flex rounded-3xl bg-brand-100 p-1.5">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 rounded-3xl p-3 text-sm font-medium transition ${
                mode === m
                  ? "bg-white text-brand-900 shadow-sm"
                  : "text-brand-600 hover:text-brand-900"
              }`}
            >
              {m === "login" ? t('auth.signIn') : t('auth.register')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "login" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-800">
                {t('auth.nickname')}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                autoComplete="username"
                placeholder={t('auth.nicknamePlaceholder')}
                className="w-full rounded-3xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-800">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full rounded-3xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-800">
                {t('auth.confirmPassword')}
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full rounded-3xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}

          {error && (
            <Bubble tone="error" className="px-4 py-2.5 text-sm">{error}</Bubble>
          )}

          {mode === "register" && (
            <p className="text-xs text-brand-600">
              {t('auth.nicknameHint')}
            </p>
          )}

          <BaseButton
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm disabled:opacity-80"
          >
            {loading ? t('auth.pleaseWait') : mode === "login" ? t('auth.signIn') : t('auth.createAccount')}
          </BaseButton>
        </form>
      </Bubble>
    </main>
  );
}
