import { useTranslation } from "react-i18next";
import { Mail, Github } from "lucide-react";

import { useNavigation } from "../../hooks/useNavigation";
import { FOOTER_LINKS } from "../../lib/siteNav";

const contactEmail =
  import.meta.env.VITE_CONTACT_EMAIL ?? "support@example.com";

const repoUrl = "https://github.com/vulpineAlicia/Wispi";
const repoLabel = "vulpineAlicia/Wispi";

export default function Footer() {
  const { t } = useTranslation();
  const { navigateTo, navigateToProfile } = useNavigation();
  const year = new Date().getFullYear();

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
              {t('footer.title')}
            </div>
            <p className="mt-3 max-w-sm text-sm text-brand-200">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-brand-50">{t('footer.resources')}</div>
            <ul className="mt-3 space-y-2 text-sm">
              {FOOTER_LINKS.map((item) => (
                <li key={item.to}>
                  <button
                    type="button"
                    onClick={() => navigateTo(item.to)}
                    className={linkClass}
                  >
                    {t(item.label)}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={navigateToProfile}
                  className={linkClass}
                >
                  {t('nav.profile')}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-brand-50">{t('footer.contact')}</div>
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

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-brand-200 sm:flex-row sm:items-center sm:justify-between">
          <span>{t('footer.copyright', { year })}</span>
          <button
            type="button"
            onClick={() => navigateTo("/terms")}
            className={linkClass}
          >
            {t('footer.terms')}
          </button>
        </div>
      </div>
    </footer>
  );
}
