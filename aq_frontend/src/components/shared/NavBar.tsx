import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Settings2 } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { getAvatar } from "../../lib/avatars";
import {
  HEADER_LINKS,
  scrollToHash,
  scrollTopSmooth,
  type NavLinkItem,
} from "../../lib/siteNav";

function navItemKey(item: NavLinkItem, prefix = "") {
  return `${prefix}${item.to}`;
}

function UserMenu() {
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
        Register / Sign in
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
            Profile
          </button>
          <button
            type="button"
            onClick={async () => { await signOut(); setOpen(false); navigate("/"); }}
            className="w-full px-4 py-2.5 text-left text-sm text-brand-700 transition hover:bg-brand-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  function closeMenu() {
    setOpen(false);
  }

  function handleNavClick(item: NavLinkItem) {
    const target = item.to;

    if (target.startsWith("#")) {
      if (!scrollToHash(target)) {
        scrollTopSmooth();
      }
      closeMenu();
      return;
    }

    const [pathname, hash = ""] = target.split("#");
    const nextHash = hash ? `#${hash}` : "";

    if (location.pathname === pathname) {
      if (nextHash) {
        if (!scrollToHash(nextHash)) {
          scrollTopSmooth();
        }
      } else {
        scrollTopSmooth();
      }

      closeMenu();
      return;
    }

    if (nextHash) {
      navigate(pathname, { state: { scrollTo: nextHash } });
    } else {
      navigate(pathname);
    }

    closeMenu();
  }

  const desktopLinkClass = "text-brand-200 transition hover:text-brand-50";
  const mobileLinkClass =
    "rounded-2xl px-3 py-2 text-left text-sm text-brand-900/80 transition hover:bg-brand-50 hover:text-brand-900";

  return (
    <div className="border-b border-white/10 bg-brand-700/95 text-brand-50 shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-3">
          <nav className="hidden gap-6 md:flex">
            {HEADER_LINKS.map((item) => (
              <button
                key={navItemKey(item)}
                type="button"
                onClick={() => handleNavClick(item)}
                className={desktopLinkClass}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <UserMenu />

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label="Toggle menu"
              className="inline-flex items-center justify-center rounded-2xl border border-brand-200 bg-white/70 px-3 py-2 text-sm text-brand-900 transition hover:bg-brand-50 md:hidden"
            >
              ☰
            </button>
          </div>
        </div>

        {open && (
          <div id="mobile-nav" className="pb-3 md:hidden">
            <div className="flex flex-col gap-2 rounded-3xl border border-brand-200 bg-white/80 p-3 backdrop-blur">
              {HEADER_LINKS.map((item) => (
                <button
                  key={navItemKey(item, "m:")}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={mobileLinkClass}
                >
                  {item.label}
                </button>
              ))}
              <hr className="border-brand-200" />
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => { navigate("/profile"); closeMenu(); }}
                    className={mobileLinkClass}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={async () => { await signOut(); closeMenu(); navigate("/"); }}
                    className={mobileLinkClass}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { navigate("/auth"); closeMenu(); }}
                  className={mobileLinkClass}
                >
                  Register / Sign in
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
