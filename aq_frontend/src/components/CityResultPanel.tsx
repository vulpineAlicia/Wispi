import { Link } from "react-router-dom";
import { getUserMessage } from "../lib/api";
import type { AirData } from "../lib/api";
import AqiPill from "./AqiPill";

function aqiAdvice(aqi: number) {
  switch (aqi) {
    case 1:
      return "Air quality is excellent — enjoy outdoor activities.";
    case 2:
      return "Air quality is fair — outdoor activities are generally OK.";
    case 3:
      return "Air quality is moderate — consider reducing long outdoor exertion if you’re sensitive.";
    case 4:
      return "Air quality is poor — limit outdoor activity, especially strenuous exercise.";
    case 5:
      return "Air quality is very poor — stay indoors when possible and avoid outdoor exercise.";
    default:
      return "Air quality info is unavailable right now.";
  }
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
};

export default function CityResultPanel({
  variant,
  name,
  lat,
  lon,
  air,
  airLoading = false,
  airError = null,
  detailsTo,
}: Props) {
  const showPollutants = variant === "map";
  const showCta = variant === "home";

  return (
    <>
      {/* Selected city (Map) */}
      <div className="mt-4 rounded-3xl border border-brand-200 bg-white px-5 py-4">
        <div className="text-base font-semibold text-brand-900">{name}</div>
        <div className="mt-1 text-xs text-brand-700/80">
          {lat.toFixed(4)}, {lon.toFixed(4)}
        </div>
      </div>

      {/* AQI (Map) */}
      <div className="mt-4 rounded-3xl border border-brand-200 bg-white px-5 py-5">
        {airLoading ? (
          <div className="text-sm text-brand-700">Loading…</div>
        ) : airError ? (
          <div className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-900 ring-1 ring-rose-200">
            {getUserMessage(airError)}
          </div>
        ) : air ? (
          <div className="text-sm text-brand-800">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base font-semibold text-brand-900">AQI</span>
              <AqiPill aqi={air.aqi_ow_1_5} />
            </div>

            {/* Advice */}
            <p className="mt-2 text-sm leading-snug text-brand-700">
              {aqiAdvice(air.aqi_ow_1_5)}
            </p>

            {/* Pollutants (Map) */}
            {showPollutants && (
              <>
                <div className="mt-4 text-sm font-semibold text-brand-900">
                  Pollutants (µg/m³)
                </div>

                <div className="mt-2 grid grid-cols-2 gap-x-10 gap-y-2">
                  {Object.entries(air.pollutants).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-brand-700">{k}</span>
                      <span className="tabular-nums text-brand-900">{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* CTA (Home) */}
            {showCta && (
              <div className="mt-4">
                <Link
                  to={detailsTo ?? "/map"}
                  className="inline-flex h-10 items-center rounded-2xl bg-brand-900 px-5 text-sm font-medium text-brand-50 transition hover:bg-brand-700"
                >
                  Detailed info →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-brand-700">No data.</div>
        )}
      </div>
    </>
  );
}