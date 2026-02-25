import { useState } from "react";
import lookupBg from "../assets/lookup-bg.png";

import { getAirCurrent } from "../lib/api";
import type { AirData, GeoResult } from "../lib/api";

import useAsync from "../hooks/useAsync";
import CitySearchBox from "../components/CitySearchBox";
import CityResultPanel from "../components/CityResultPanel";

import FeatureCard from "../components/FeatureCard";

const FEATURES = [
  { title: "City AQI lookup", desc: "Search any city and get clear, readable air quality metrics." },
  { title: "Health guidance", desc: "Quick recommendations based on pollution level and risk groups." },
  { title: "History & trends", desc: "See changes over time and spot spikes in air pollution." },
  { title: "Alerts", desc: "Get notified when your city crosses a chosen threshold." },
];

export default function Home() {
  const [selected, setSelected] = useState<GeoResult | null>(null);

  const airReq = useAsync<AirData>();
  const air = airReq.data ?? null;

  const detailsTo = selected
    ? `/map?lat=${selected.lat}&lon=${selected.lon}&name=${encodeURIComponent(selected.name)}`
    : "/map";

  const selectedLabel = selected
    ? `${selected.name}${selected.state ? `, ${selected.state}` : ""} — ${selected.country}`
    : "";

  return (
    <>
      <div id="top" />

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-14">
        {/* Hero */}
        <section id="lookup" className="mt-2 scroll-mt-35">
          <div
            className="
              relative flex min-h-[68vh] items-center overflow-hidden rounded-3xl
              ring-1 ring-brand-300/50
              shadow-[0_20px_50px_-20px_rgba(15,58,87,0.35)]
            "
          >
            {/* Background */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${lookupBg})` }}
            />
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[3px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/40 to-transparent" />

            {/* Content */}
            <div className="relative w-full p-6 md:p-9">
              <div className="max-w-2xl">
                {/* Title */}
                <div className="flex flex-col gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-brand-900 md:text-4xl">
                    Look up air quality in your city
                  </h1>
                  <p className="text-base text-brand-700 md:text-lg">
                    Enter a city name to get real-time air quality data and recommendations.
                  </p>
                </div>

                {/* Search */}
                <div className="mt-5 w-full max-w-xl">
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

                {/* Air fetch error */}
                {airReq.error && (
                  <div className="mt-4 w-full max-w-xl rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
                    {airReq.error}
                  </div>
                )}

                {/* Results */}
                {selected && (
                  <div className="w-full max-w-xl">
                    <CityResultPanel
                      variant="home"
                      name={selectedLabel}
                      lat={selected.lat}
                      lon={selected.lon}
                      air={air}
                      airLoading={airReq.loading}
                      airError={airReq.error}
                      detailsTo={detailsTo}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-16 mb-14 scroll-mt-40">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-brand-900 md:text-2xl">Features</h2>
            <p className="text-sm text-brand-700 md:text-base">
              Everything you need to track air quality and plan your day.
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} title={feature.title} desc={feature.desc} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}