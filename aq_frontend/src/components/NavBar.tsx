import { useState } from "react";

const links = [
  { label: "Look up your city", href: "#top" },
  { label: "Features", href: "#features" },
  { label: "Map", href: "#map" },
  { label: "Archive", href: "#archive" },
  { label: "Useful info", href: "#info" },
  { label: "Contacts", href: "#contacts" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/10 bg-brand-700/95 text-brand-50 shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-3">
          {/* Desktop navigation */}
          <nav className="hidden gap-6 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-brand-200 transition hover:text-brand-50"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Desktop auth button */}
            <a
              href="#auth"
              className="hidden rounded-2xl bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-50 hover:text-brand-900 md:inline-flex"
            >
              Register / Sign in
            </a>

            {/* Mobile menu toggle */}
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
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-3 py-2 text-sm text-brand-900/80 transition hover:bg-brand-50 hover:text-brand-900"
                >
                  {link.label}
                </a>
              ))}

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
