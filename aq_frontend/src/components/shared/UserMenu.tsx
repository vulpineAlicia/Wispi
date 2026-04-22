import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Settings2 } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { getAvatar } from "../../lib/avatars";

export default function UserMenu() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => navigate("/auth")}
        className="hidden rounded-3xl bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-50 hover:text-brand-900 md:inline-flex"
      >
        {t('nav.registerSignIn')}
      </button>
    );
  }

  const avatar = getAvatar(user.avatar_id);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-brand-100 transition hover:text-brand-50"
      >
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-base ${avatar.bg} ${avatar.ring}`}>
          {avatar.emoji}
        </span>
        <span className="max-w-32 truncate font-medium">{user.nickname}</span>
        <Settings2 size={16} className="text-brand-200" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-4 w-44 overflow-hidden rounded-3xl border border-brand-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={() => { navigate("/profile"); setOpen(false); }}
            className="w-full px-4 py-2.5 text-left text-sm text-brand-700 transition hover:bg-brand-50"
          >
            {t('nav.profile')}
          </button>
          <button
            type="button"
            onClick={async () => { await signOut(); setOpen(false); navigate("/"); }}
            className="w-full px-4 py-2.5 text-left text-sm text-brand-700 transition hover:bg-brand-50"
          >
            {t('nav.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
