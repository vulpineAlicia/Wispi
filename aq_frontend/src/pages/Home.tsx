import { useState } from "react";

import lookupBg from "../assets/lookup-bg.png";
import CityResultPanel from "../components/CityResultPanel";
import CitySearchBox from "../components/CitySearchBox";
import FeatureCard from "../components/FeatureCard";
import { useAirHistory } from "../hooks/useAirHistory";
import type { GeoResult } from "../lib/api";
import { mapUrl } from "../lib/mapUrl";

const FEATURES = [
  {
    title: "City AQI lookup",
    desc: "Search any city and get clear, readable air quality metrics.",
  },
  {
    title: "Health guidance",
    desc: "Quick recommendations based on the current air quality level.",
  },
  {
    title: "History & trends",
    desc: "Explore recent air quality changes for selected locations.",
  },
  {
    title: "Interactive map",
    desc: "Open the map view and inspect conditions by location.",
  },
];

export default function Home() {
  const [selected, setSelected] = useState<GeoResult | null>(null);

  const history = useAirHistory(selected?.lat ?? null, selected?.lon ?? null, 1);

  const detailsTo = selected
    ? mapUrl(selected.lat, selected.lon, selected.name)
    : "/map";

  const selectedLabel = selected
    ? `${selected.name}${selected.state ? `, ${selected.state}` : ""} — ${selected.country}`
    : "";

  return (
    <main className="mx-auto max-w-6xl px-4 pb-14 pt-8">
      <section id="lookup" className="mt-2 scroll-mt-35">
        <div className="relative flex min-h-[70vh] items-center overflow-hidden rounded-3xl ring-1 ring-brand-300/50 shadow-[0_20px_50px_-20px_rgba(15,58,87,0.35)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${lookupBg})` }}
          />
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[3px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/40 to-transparent" />

          <div className="relative w-full p-6 md:p-9">
            <div className="max-w-2xl">
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-brand-900 md:text-4xl">
                  Look up air quality in your city
                </h1>
                <p className="text-base text-brand-700 md:text-lg">
                  Enter a city name to get real-time air quality data and
                  recommendations.
                </p>
              </div>

              <div className="mt-5 w-full max-w-xl">
                <CitySearchBox
                  placeholder="e.g., Tbilisi"
                  buttonText={history.loading ? "Loading…" : "Search"}
                  disabled={history.loading}
                  onSelect={setSelected}
                />
              </div>

              {selected && (
                <div className="w-full max-w-xl">
                  <CityResultPanel
                    variant="home"
                    name={selectedLabel}
                    lat={selected.lat}
                    lon={selected.lon}
                    panel={history.model.latestPanel}
                    loading={history.loading}
                    error={history.error}
                    detailsTo={detailsTo}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mb-14 mt-16 scroll-mt-40">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-brand-900 md:text-2xl">
            Features
          </h2>
          <p className="text-sm text-brand-700 md:text-base">
            Everything you need to track air quality and plan your day.
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              desc={feature.desc}
            />
          ))}
        </div>
      </section>
    </main>
  );
}