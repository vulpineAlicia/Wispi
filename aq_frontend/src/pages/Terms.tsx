import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-8 text-brand-900">
      <div className="mt-6 md:rounded-3xl md:border md:border-brand-200 md:bg-brand-50 md:p-10 md:shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t('terms.title')}
        </h1>
        <p className="mt-3 text-base text-brand-700 md:text-lg">
          {t('terms.intro')}
        </p>

        <div className="mt-8 space-y-6 text-brand-800">
          <section>
            <h2 className="text-xl font-semibold">{t('terms.useTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">
              {t('terms.useBody')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">{t('terms.dataTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">
              {t('terms.dataBody')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">{t('terms.liabilityTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">
              {t('terms.liabilityBody')}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
