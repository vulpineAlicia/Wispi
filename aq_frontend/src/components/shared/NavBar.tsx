import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { useNavigation } from "../../hooks/useNavigation";
import { HEADER_LINKS, type NavLinkItem } from "../../lib/siteNav";
import UserMenu from "./UserMenu";

function navItemKey(item: NavLinkItem, prefix = "") {
  return `${prefix}${item.to}`;
}

export default function NavBar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { navigateTo } = useNavigation();

  function closeMenu() {
    setOpen(false);
  }

  function handleNavClick(item: NavLinkItem) {
    closeMenu();
    requestAnimationFrame(() => navigateTo(item.to));
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
                {t(item.label)}
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
              aria-label={t('nav.toggleMenu')}
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
                  {t(item.label)}
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
                    {t('nav.profile')}
                  </button>
                  <button
                    type="button"
                    onClick={async () => { await signOut(); closeMenu(); navigate("/"); }}
                    className={mobileLinkClass}
                  >
                    {t('nav.signOut')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { closeMenu(); requestAnimationFrame(() => navigateTo("/auth")); }}
                  className={mobileLinkClass}
                >
                  {t('nav.registerSignIn')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
