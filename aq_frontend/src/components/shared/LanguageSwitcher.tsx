import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <div className="flex items-center gap-0.5 text-xs">
      {(['en', 'ru'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => void i18n.changeLanguage(lang)}
          className={`rounded px-2 py-1 transition ${
            current === lang
              ? 'font-semibold text-brand-50'
              : 'text-brand-300 hover:text-brand-50'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
