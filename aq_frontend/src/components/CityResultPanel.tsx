import { getUserMessage } from "../lib/apiMessages";
import type { AirData } from "../lib/api";
import AqiPill from "./AqiPill";
import Bubble from "./Bubble";
import BaseButton from "../components/BaseButton";

const AQI_ADVICE: Record<number, string> = {
  1: "Air quality is excellent — enjoy outdoor activities.",
  2: "Air quality is fair — outdoor activities are generally OK.",
  3: "Air quality is moderate — consider reducing long outdoor exertion if you’re sensitive.",
  4: "Air quality is poor — limit outdoor activity, especially strenuous exercise.",
  5: "Air quality is very poor — stay indoors when possible and avoid outdoor exercise.",
};

function aqiAdvice(aqi: number) {
  return AQI_ADVICE[aqi] ?? "Air quality info is unavailable right now.";
}

type Variant = "home" | "map";

type Props = {
  variant: Variant;

  name: string;
  lat: number;
  lon: number;

  air: AirData | null;
  airLoading?: boolean;
  airError?: unknown | null;
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
  lat,
  lon,
  air,
  airLoading = false,
  airError = null,
  detailsTo,
  showAqi = true,
  showLocation = true,
}: Props) {
  const showPollutants = variant === "map";
  const showCta = variant === "home";

  const pollutantsEntries = Object.entries(air?.pollutants ?? {});
  const hasPollutants = pollutantsEntries.length > 0;

  const dest =
  detailsTo ?? `/map?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`;

  return (
    <>
      {showLocation && (
        <Bubble className="mt-4 px-5 py-4">
          <div className="text-base font-semibold text-brand-900">{name}</div>
          <div className="mt-1 text-xs text-brand-700/80">
            {lat.toFixed(4)}, {lon.toFixed(4)}
          </div>
        </Bubble>
      )}

      {showAqi && (
        <Bubble className="mt-4 px-5 py-5">
          {airLoading ? (
            <div className="text-sm text-brand-700">Loading…</div>
          ) : airError ? (
            <Bubble tone="error" className="px-3 py-2 text-sm">
              {getUserMessage(airError)}
            </Bubble>
          ) : air ? (
            <div className="text-sm text-brand-800">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-base font-semibold text-brand-900">AQI</span>
                <AqiPill aqi={air.aqi_ow_1_5} />
              </div>

              <p className="mt-2 text-sm leading-snug text-brand-700">
                {aqiAdvice(air.aqi_ow_1_5)}
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