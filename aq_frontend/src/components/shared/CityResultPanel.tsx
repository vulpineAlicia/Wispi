import { useTranslation } from "react-i18next";
import BaseButton from "../templates/BaseButton";
import { getUserMessage } from "../../api/apiMessages";
import { buildMapUrl } from "../../lib/locationSelection";
import type { HistoryPanelData } from "../../lib/historyModel";
import AqiPill from "./AqiPill";
import Bubble from "../templates/Bubble";
import FavoriteButton from "./FavoriteButton";

const adviceKeys: Record<number, string> = {
  1: "aqi.advice.1",
  2: "aqi.advice.2",
  3: "aqi.advice.3",
  4: "aqi.advice.4",
  5: "aqi.advice.5",
};

type Variant = "home" | "map";

type Props = {
  variant: Variant;

  name: string;
  country?: string | null;
  lat: number;
  lon: number;

  panel: HistoryPanelData | null;
  loading?: boolean;
  error?: unknown | null;
  detailsTo?: string;

  showAqi?: boolean;
  showLocation?: boolean;
};

function formatPollutantValue(v: number) {
  return Number.isFinite(v) ? v.toFixed(1) : String(v);
}

export default function CityResultPanel({
  variant,
  name,
  country,
  lat,
  lon,
  panel,
  loading = false,
  error = null,
  detailsTo,
  showAqi = true,
  showLocation = true,
}: Props) {
  const { t } = useTranslation();

  const showPollutants = variant === "map";
  const showCta = variant === "home";

  const pollutantsEntries = Object.entries(panel?.pollutants ?? {});
  const hasPollutants = pollutantsEntries.length > 0;

  const dest = detailsTo ?? buildMapUrl({ lat, lon, name });

  return (
    <>
      {showLocation && (
        <Bubble className="mt-4 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-brand-900">{name}</div>
              <div className="mt-1 text-xs text-brand-700/80">
                {lat.toFixed(4)}, {lon.toFixed(4)}
              </div>
            </div>
            <FavoriteButton
              name={name}
              country={country}
              lat={lat}
              lon={lon}
              className="shrink-0 text-rose-400 hover:text-rose-600"
            />
          </div>
        </Bubble>
      )}

      {showAqi && (
        <Bubble className={`${showLocation ? "mt-4" : ""} px-5 py-5`}>
          {loading ? (
            <div className="text-sm text-brand-700">{t('cityResult.loading')}</div>
          ) : error ? (
            <Bubble tone="error" className="px-3 py-2 text-sm">
              {getUserMessage(error)}
            </Bubble>
          ) : panel && panel.aqi != null ? (
            <div className="text-sm text-brand-800">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-base font-semibold text-brand-900">
                  {t('aqi.label')}
                </span>
                <AqiPill aqi={panel.aqi} />
              </div>

              <p className="mt-2 text-sm leading-snug text-brand-700">
                {t(adviceKeys[panel.aqi] ?? "aqi.advice.unknown")}
              </p>

              {showPollutants && (
                <>
                  <div className="mt-4 text-sm font-semibold text-brand-900">
                    {t('cityResult.pollutants')}
                  </div>

                  {!hasPollutants ? (
                    <div className="mt-2 text-sm text-brand-700">
                      {t('cityResult.noPollutants')}
                    </div>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-x-10 gap-y-2">
                      {pollutantsEntries.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3">
                          <span className="text-brand-700">{k}</span>
                          <span className="tabular-nums text-brand-900">
                            {formatPollutantValue(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {showCta && (
                <div className="mt-4">
                  <BaseButton
                    to={dest}
                    className="inline-flex h-10 items-center px-5 text-sm"
                  >
                    {t('cityResult.detailedInfo')}
                  </BaseButton>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-brand-700">{t('cityResult.noData')}</div>
          )}
        </Bubble>
      )}
    </>
  );
}
