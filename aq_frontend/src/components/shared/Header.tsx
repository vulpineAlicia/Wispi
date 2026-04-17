import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import logo from "../../assets/logo.svg";
import { scrollTopSmooth } from "../../lib/siteNav";
import LanguageSwitcher from "./LanguageSwitcher";
import ServerStatusPill from "./ServerStatusPill";

export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  function goHomeTop() {
    if (location.pathname === "/" && !location.hash) {
      scrollTopSmooth();
      return;
    }

    navigate("/");
  }

  return (
    <header className="border-b border-white/10 bg-brand-900 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <button
          type="button"
          onClick={goHomeTop}
          className="flex items-center gap-4 text-left"
        >
          <img
            src={logo}
            alt={t('header.logoAlt')}
            className="h-12 w-12 shrink-0 -mr-3"
          />

          <div className="leading-tight">
            <div className="text-lg font-semibold text-brand-50">{t('header.title')}</div>
            <div className="text-sm text-brand-200">
              {t('header.subtitle')}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ServerStatusPill />
        </div>
      </div>
    </header>
  );
}
