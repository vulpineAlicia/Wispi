import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  HEADER_LINKS,
  type NavItem,
  type RoutePath,
  type SectionId,
  scrollToId,
  scrollTopSmooth,
} from "../lib/siteNav";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function closeMenu() {
    setOpen(false);
  }

  function handleSection(id: SectionId) {
    if (id === "top") {
      if (location.pathname !== "/") navigate("/");
      else scrollTopSmooth();
      return;
    }

    if (id === "features") {
      if (location.pathname !== "/") {
        navigate("/", { state: { scrollToId: "features" } });
      } else if (!scrollToId("features")) {
        scrollTopSmooth();
      }
      return;
    }

    if (!scrollToId("contacts")) {
      navigate("/", { state: { scrollToId: "contacts" } });
    }
  }

  function handleRoute(to: RoutePath) {
    if (location.pathname === to) {
      scrollTopSmooth();
      return;
    }

    navigate(to);
  }

  function handleNavClick(item: NavItem) {
    if (item.kind === "section") handleSection(item.id);
    else handleRoute(item.to);

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
                key={item.kind === "section" ? `section:${item.id}` : `route:${item.to}`}
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
              onClick={() => setOpen((v) => !v)}
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
                  key={item.kind === "section" ? `m:section:${item.id}` : `m:route:${item.to}`}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={mobileLinkClass}
                >
                  {item.label}
                </button>
              ))}

              <a
                href="#auth"
                onClick={closeMenu}
                className="rounded-2xl bg-brand-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-50 hover:text-brand-900"
              >
                Register / Sign in
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}