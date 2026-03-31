import BaseButton from "../templates/BaseButton";
import { getUserMessage } from "../../lib/services/apiMessages";
import type { HistoryPanelData } from "../../lib/historyModel";
import AqiPill from "./AqiPill";
import Bubble from "../templates/Bubble";
import FavoriteButton from "./FavoriteButton";

const AQI_ADVICE: Record<number, string> = {
  1: "Air quality is excellent — enjoy outdoor activities.",
  2: "Air quality is fair — outdoor activities are generally OK.",
  3: "Air quality is moderate — consider reducing long outdoor exertion.",
  4: "Air quality is poor — limit outdoor activity.",
  5: "Air quality is very poor — stay indoors, if possible.",
};

function aqiAdvice(aqi: number) {
  return AQI_ADVICE[aqi] ?? "Air quality info is unavailable right now.";
}

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
  const showPollutants = variant === "map";
  const showCta = variant === "home";

  const pollutantsEntries = Object.entries(panel?.pollutants ?? {});
  const hasPollutants = pollutantsEntries.length > 0;

  const dest =
    detailsTo ?? `/map?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`;

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
            <div className="text-sm text-brand-700">Loading…</div>
          ) : error ? (
            <Bubble tone="error" className="px-3 py-2 text-sm">
              {getUserMessage(error)}
            </Bubble>
          ) : panel && panel.aqi != null ? (
            <div className="text-sm text-brand-800">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-base font-semibold text-brand-900">
                  AQI
                </span>
                <AqiPill aqi={panel.aqi} />
              </div>

              <p className="mt-2 text-sm leading-snug text-brand-700">
                {aqiAdvice(panel.aqi)}
              </p>

              {showPollutants && (
                <>
                  <div className="mt-4 text-sm font-semibold text-brand-900">
                    Pollutants (µg/m³)
                  </div>

                  {!hasPollutants ? (
                    <div className="mt-2 text-sm text-brand-700">
                      No pollutant breakdown available for this day.
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
                    Detailed info →
                  </BaseButton>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-brand-700">No data.</div>
          )}
        </Bubble>
      )}
    </>
  );
}