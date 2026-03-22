import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  HEADER_LINKS,
  scrollToHash,
  scrollTopSmooth,
  type NavLinkItem,
} from "../../lib/siteNav";

function navItemKey(item: NavLinkItem, prefix = "") {
  return `${prefix}${item.to}`;
}

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

    navigate({
      pathname,
      hash: nextHash,
    });

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

            <a
              href="#auth"
              className="hidden rounded-2xl bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-50 hover:text-brand-900 md:inline-flex"
            >
              Register / Sign in
            </a>

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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}