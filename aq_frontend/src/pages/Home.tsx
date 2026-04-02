import { useState } from "react";

import lookupBg from "../assets/lookup-bg.png";
import CityResultPanel from "../components/shared/CityResultPanel";
import CitySearchBox from "../components/shared/CitySearchBox";
import FeatureCard from "../components/home/FeatureCard";
import { useAirHistory } from "../hooks/useAirHistory";
import type { GeoResult } from "../lib/services/api";
import { buildMapUrl } from "../lib/locationSelection";

const FEATURES = [
  {
    title: "City AQI lookup",
    desc: "Search any city and get clear, readable air quality metrics.",
  },
  {
    title: "Health impact",
    desc: "Quick recommendations based on the current air quality level.",
  },
  {
    title: "Archive",
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
    ? buildMapUrl({
        lat: selected.lat,
        lon: selected.lon,
        name: selected.name,
        country: selected.country,
      })
    : "/map";

  return (
    <main className="mx-auto max-w-6xl px-4 pb-14 pt-8">
      <section id="lookup" className="mt-2 scroll-mt-35">
        <div className="relative flex items-center md:min-h-[70vh] md:overflow-hidden md:rounded-3xl md:ring-1 md:ring-brand-300/50 md:shadow-[0_20px_50px_-20px_rgba(15,58,87,0.35)]">
          <div
            className="absolute inset-0 hidden bg-cover bg-center md:block"
            style={{ backgroundImage: `url(${lookupBg})` }}
          />
          <div className="absolute inset-0 hidden bg-white/5 backdrop-blur-[3px] md:block" />
          <div className="absolute inset-0 hidden bg-linear-to-r from-white/70 via-white/40 to-transparent md:block" />

          <div className="relative w-full p-0 md:p-9">
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
                    name={selected.name}
                    country={selected.country}
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

      <section id="features" className="mb-14 mt-16 scroll-mt-24 md:scroll-mt-40">
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