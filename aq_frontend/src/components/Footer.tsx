import { useLocation, useNavigate } from "react-router-dom";
import { Mail, Github } from "lucide-react";

import { FOOTER_LINKS, type RoutePath, scrollTopSmooth } from "../lib/siteNav";

const year = new Date().getFullYear();

const contactEmail =
  import.meta.env.VITE_CONTACT_EMAIL ?? "support@example.com";

const repoUrl =
  import.meta.env.VITE_REPO_URL ?? "https://github.com/vulpineAlicia/Wispi";

const repoLabel =
  import.meta.env.VITE_REPO_LABEL ?? "vulpineAlicia/Wispi";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  function goToRoute(path: RoutePath) {
    if (location.pathname === path) {
      scrollTopSmooth();
      return;
    }

    navigate(path);
  }

  const linkClass = "text-brand-200 transition hover:text-brand-50";
  const contactLinkClass = "flex items-center gap-2 text-brand-200 transition hover:text-brand-50";

  return (
    <footer
      id="contacts"
      className="border-t border-white/10 bg-brand-900 text-brand-50/90"
    >
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_0.7fr_1fr] md:gap-16">
          <div>
            <div className="text-lg font-semibold text-brand-50">
              Wispi - Air Quality Monitor
            </div>
            <p className="mt-3 max-w-sm text-sm text-brand-200">
              A simple dashboard to look up air quality and make safer daily
              decisions.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-brand-50">Resources</div>
            <ul className="mt-3 space-y-2 text-sm">
              {FOOTER_LINKS.map((item) => (
                <li key={item.to}>
                  <button
                    type="button"
                    onClick={() => goToRoute(item.to)}
                    className={linkClass}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-brand-50">Contact</div>
            <div className="mt-3 space-y-3 text-sm text-brand-200">
              <a
                href={`mailto:${contactEmail}`}
                className={contactLinkClass}
              >
                <Mail size={16} />
                {contactEmail}
              </a>

              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className={contactLinkClass}
              >
                <Github size={16} />
                {repoLabel}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-brand-200">
          © {year} Wispi - Air Quality Monitor
        </div>
      </div>
    </footer>
  );
}