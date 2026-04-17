import { Trans, useTranslation } from "react-i18next";
import FAQ from "../components/info/FAQ";

export default function UsefulInfo() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 text-brand-900">
      <div className="mt-6 md:rounded-3xl md:border md:border-brand-200 md:bg-brand-50 md:p-10 md:shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t('info.title')}
        </h1>
        <p className="mt-3 text-base text-brand-700 md:text-lg">
          {t('info.subtitle')}
        </p>

        <div className="mt-8 space-y-6">
          <FAQ
            q={t('info.q1')}
            a={<Trans i18nKey="info.a1" components={{ bold: <b /> }} />}
          />
          <FAQ
            q={t('info.q2')}
            a={<Trans i18nKey="info.a2" components={{ bold: <b /> }} />}
          />
          <FAQ
            q={t('info.q3')}
            a={
              <div className="space-y-4">
                <p><Trans i18nKey="info.a3" components={{ bold: <b /> }} /></p>
                <a
                  href="https://openweathermap.org/api/air-pollution?collection=environmental"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-brand-200 hover:text-brand-400 visited:text-brand-600"
                  title="OpenWeather — Air Pollution API concept"
                >
                  source: https://openweathermap.org/api/air-pollution?collection=environmental
                </a>
              </div>
            }
          />
          <FAQ
            q={t('info.q4')}
            a={
              <ul className="list-disc pl-5 space-y-1">
                <li><Trans i18nKey="info.a4_1" components={{ bold: <b /> }} /></li>
                <li><Trans i18nKey="info.a4_2" components={{ bold: <b /> }} /></li>
                <li><Trans i18nKey="info.a4_3" components={{ bold: <b /> }} /></li>
                <li><Trans i18nKey="info.a4_4" components={{ bold: <b /> }} /></li>
                <li><Trans i18nKey="info.a4_5" components={{ bold: <b /> }} /></li>
              </ul>
            }
          />
          <FAQ
            q={t('info.q5')}
            a={
              <div className="space-y-4">
                <p><Trans i18nKey="info.a5" components={{ bold: <b /> }} /></p>
                <a
                  href="https://www.epa.gov/outdoor-air-quality-data/air-data-basic-information"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-brand-200 hover:text-brand-400 visited:text-brand-600"
                  title="United States Environmental Protection Agency — Air Data Basic Information"
                >
                  source: https://www.epa.gov/outdoor-air-quality-data/air-data-basic-information
                </a>
              </div>
            }
          />
          <FAQ
            q={t('info.q6')}
            a={
              <div className="space-y-4">
                <p>{t('info.a6_1')}</p>
                <p><Trans i18nKey="info.a6_2" components={{ bold: <b /> }} /></p>
                <p><Trans i18nKey="info.a6_3" components={{ bold: <b /> }} /></p>
                <p>{t('info.a6_4')}</p>
                <a
                  href="https://www.who.int/teams/environment-climate-change-and-health/air-quality-energy-and-health/health-impacts/exposure-air-pollution"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-brand-200 hover:text-brand-400 visited:text-brand-600"
                  title="World Health Organization — Air quality and health"
                >
                  source: https://www.who.int/teams/environment-climate-change-and-health/air-quality-energy-and-health/health-impacts/exposure-air-pollution
                </a>
              </div>
            }
          />
          <FAQ
            q={t('info.q7')}
            a={t('info.a7')}
          />
          <FAQ
            q={t('info.q8')}
            a={<Trans i18nKey="info.a8" components={{ bold: <b /> }} />}
          />
          <FAQ
            q={t('info.q9')}
            a={<Trans i18nKey="info.a9" components={{ bold: <b /> }} />}
          />
          <FAQ
            q={t('info.q10')}
            a={<Trans i18nKey="info.a10" components={{ bold: <b /> }} />}
          />
        </div>
      </div>
    </main>
  );
}
