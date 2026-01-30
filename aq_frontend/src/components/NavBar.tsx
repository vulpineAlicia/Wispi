import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const links = [
  { label: "Look up your city", to: "#top" },
  { label: "Features", to: "#features" },
  { label: "Map", to: "#map" },
  { label: "Archive", to: "#archive" },
  { label: "Useful info", to: "/info" },
  { label: "Contacts", to: "#contacts" },
];

function isHashOnly(to: string) {
  return to.startsWith("#");
}

export default function NavBar() {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  function goToHash(hash: string) {
    const scrollNow = () => {
      if (hash === "#top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (hash === "#contacts") {
      scrollNow();
      return;
    }

    if (location.pathname !== "/") {
      navigate("/" + hash);
      return;
    }

    if (location.hash === hash) {
      scrollNow();
      return;
    }

    navigate(hash);
  }


  function goToRouteTop(path: string) {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(path);
    }
  }

  return (
    <div className="border-b border-white/10 bg-brand-700/95 text-brand-50 shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-3">
          {/* Desktop navigation */}
          <nav className="hidden gap-6 md:flex">
            {links.map((link) =>
              isHashOnly(link.to) ? (
                <button
                  key={link.to}
                  type="button"
                  onClick={() => goToHash(link.to)}
                  className="text-brand-200 transition hover:text-brand-50"
                >
                  {link.label}
                </button>
              ) : link.to === "/info" ? (
                <button
                  key={link.to}
                  type="button"
                  onClick={() => goToRouteTop("/info")}
                  className="text-brand-200 transition hover:text-brand-50"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-brand-200 transition hover:text-brand-50"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Right side actions */}
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
              aria-label="Toggle menu"
              className="inline-flex items-center justify-center rounded-2xl border border-brand-200 bg-white/70 px-3 py-2 text-sm text-brand-900 transition hover:bg-brand-50 md:hidden"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="pb-3 md:hidden">
            <div className="flex flex-col gap-2 rounded-3xl border border-brand-200 bg-white/80 p-3 backdrop-blur">
              {links.map((link) =>
                isHashOnly(link.to) ? (
                  <button
                    key={link.to}
                    type="button"
                    onClick={() => {
                      goToHash(link.to);
                      setOpen(false);
                    }}
                    className="rounded-2xl px-3 py-2 text-left text-sm text-brand-900/80 transition hover:bg-brand-50 hover:text-brand-900"
                  >
                    {link.label}
                  </button>
                ) : link.to === "/info" ? (
                  <button
                    key={link.to}
                    type="button"
                    onClick={() => {
                      goToRouteTop("/info");
                      setOpen(false);
                    }}
                    className="rounded-2xl px-3 py-2 text-left text-sm text-brand-900/80 transition hover:bg-brand-50 hover:text-brand-900"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="rounded-2xl px-3 py-2 text-sm text-brand-900/80 transition hover:bg-brand-50 hover:text-brand-900"
                  >
                    {link.label}
                  </Link>
                )
              )}

              <a
                href="#auth"
                onClick={() => setOpen(false)}
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

