import { useState } from "react";
import { Link } from "react-router-dom";
import lookupBg from "../assets/lookup-bg.png";
import { getAirCurrent } from "../lib/api";
import type { AirData, GeoResult } from "../lib/api";

import { aqiAdvice } from "../lib/aqi";
import AqiPill from "../components/AqiPill";
import useAsync from "../hooks/useAsync";
import CitySearchBox from "../components/CitySearchBox";

export default function CityLookup() {
  const [selected, setSelected] = useState<GeoResult | null>(null);

  const airReq = useAsync<AirData>();
  const air = airReq.data;

  const detailsTo = selected
    ? `/map?lat=${selected.lat}&lon=${selected.lon}&name=${encodeURIComponent(selected.name)}`
    : "/map";

  return (
    <section id="lookup" className="mt-2 scroll-mt-35">
      <div className="group relative flex min-h-[72vh] items-center overflow-hidden rounded-3xl ring-1 ring-brand-300/50 shadow-[0_20px_50px_-20px_rgba(15,58,87,0.35)] transition hover:-translate-y-1 hover:shadow-[0_32px_80px_-32px_rgba(15,58,87,0.65)]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${lookupBg})` }}
        />
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[3px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/20" />

        <div className="relative w-full p-6 md:p-10">
          <div className="max-w-2xl">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-semibold tracking-tight text-brand-900 md:text-4xl">
                Look up air quality in your city
              </h1>
              <p className="text-base text-brand-700 md:text-lg">
                Enter a city name to get real-time air quality data and recommendations.
              </p>
            </div>

            <div className="mt-7 w-full max-w-xl">
              <CitySearchBox
                placeholder="e.g., Tbilisi"
                buttonText={airReq.loading ? "Loading…" : "Search"}
                disabled={airReq.loading}
                onSelect={async (place) => {
                  setSelected(place);
                  await airReq.run(
                    () => getAirCurrent(place.lat, place.lon),
                    "Could not load air quality data for this city."
                  );
                }}
              />
            </div>

            {airReq.error && (
              <div className="mt-4 w-full max-w-xl rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
                {airReq.error}
              </div>
            )}

            {selected && (
              <div className="mt-5 w-full max-w-xl rounded-2xl bg-white p-4 ring-1 ring-brand-200 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-brand-900">
                      {selected.name}
                      {selected.state ? `, ${selected.state}` : ""} — {selected.country}
                    </div>
                    <div className="mt-1 text-sm text-brand-700/80">
                      lat {selected.lat}, lon {selected.lon}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-base text-brand-700">AQI (OpenWeather):</span>
                  {air ? (
                    <AqiPill aqi={air.aqi_ow_1_5} />
                  ) : (
                    <span className="text-sm text-brand-700/70">Loading air data…</span>
                  )}
                </div>

                {air && (
                  <p className="mt-2 text-base text-brand-700">
                    {aqiAdvice(air.aqi_ow_1_5)}
                  </p>
                )}

                <Link
                  to={detailsTo}
                  className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand-900 px-5 text-base font-medium text-brand-50 transition hover:bg-brand-700"
                  title="details"
                >
                  Detailed info →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
