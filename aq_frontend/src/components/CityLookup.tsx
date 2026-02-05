import { useState } from "react";
import { Link } from "react-router-dom";
import lookupBg from "../assets/lookup-bg.png";
import { geocodeCity, getAirCurrent } from "../lib/api";
import type { AirData, GeoResult } from "../lib/api";

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

function aqiMeta(aqi: number) {
  switch (aqi) {
    case 1:
      return { label: "Good", badge: "bg-emerald-100 text-emerald-900 ring-emerald-200" };
    case 2:
      return { label: "Fair", badge: "bg-lime-100 text-lime-900 ring-lime-200" };
    case 3:
      return { label: "Moderate", badge: "bg-amber-100 text-amber-900 ring-amber-200" };
    case 4:
      return { label: "Poor", badge: "bg-rose-100 text-rose-900 ring-rose-200" };
    case 5:
      return { label: "Very Poor", badge: "bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-200" };
    default:
      return { label: "Unknown", badge: "bg-slate-100 text-slate-900 ring-slate-200" };
  }
}

export default function CityLookup() {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [results, setResults] = useState<GeoResult[]>([]);
  const [selected, setSelected] = useState<GeoResult | null>(null);
  const [air, setAir] = useState<AirData | null>(null);

  async function onSearch() {
    const q = city.trim();
    if (!q) return;

    setLoading(true);
    setErr(null);
    setResults([]);
    setSelected(null);
    setAir(null);

    try {
      const r = await geocodeCity(q);
      setResults(r);
      if (r.length === 0) setErr("No matches found. Try a different spelling.");
    } catch {
      setErr("Could not search cities (backend unavailable?)");
    } finally {
      setLoading(false);
    }
  }

  async function onSelect(city: GeoResult) {
    setSelected(city);
    setAir(null);
    setErr(null);

    setLoading(true);
    try {
      const a = await getAirCurrent(city.lat, city.lon);
      setAir(a);
    } catch {
      setErr("Could not load air quality data for this city.");
    } finally {
      setLoading(false);
    }
  }

  const meta = air ? aqiMeta(air.aqi_ow_1_5) : null;
  
  // detailed indo -> map
  const detailsTo = selected
    ? `/map?lat=${selected.lat}&lon=${selected.lon}&name=${encodeURIComponent(selected.name)}`
    : "/map";


  return (
    <section id="lookup" className="mt-2 scroll-mt-35">
      <div className="group relative flex min-h-[72vh] items-center overflow-hidden rounded-3xl ring-1 ring-brand-300/50 shadow-[0_20px_50px_-20px_rgba(15,58,87,0.35)] transition hover:-translate-y-1 hover:shadow-[0_32px_80px_-32px_rgba(15,58,87,0.65)]">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${lookupBg})` }}
        />
        {/* Bg image overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[3px]" />
        {/* Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/40 to-transparent" />
        {/* Inner edge glow */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/20" />

        {/* Content */}
        <div className="relative w-full p-6 md:p-10">
          <div className="max-w-2xl">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-semibold tracking-tight text-brand-900 md:text-4xl">
                Look up air quality in your city
              </h1>
              <p className="text-base text-brand-700 md:text-lg">
                Enter a city name to get real-time air quality data and recommendations.
              </p>
            </div>

            {/* Search */}
            <div className="mt-7 w-full max-w-xl rounded-2xl bg-white p-2 ring-1 ring-brand-200">
              <label className="sr-only" htmlFor="city-input">
                City name
              </label>

              <div className="flex items-center gap-2">
                <input
                  id="city-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch();
                  }}
                  placeholder="e.g., Tbilisi"
                  className="h-11 w-full bg-transparent px-3 text-base outline-none placeholder:text-brand-900/50"
                />

                <button
                  type="button"
                  onClick={onSearch}
                  className="h-11 shrink-0 rounded-xl bg-brand-900 px-6 text-base font-medium text-brand-50 transition hover:bg-brand-700"
                >
                  {loading ? "Loading…" : "Search"}
                </button>
              </div>
            </div>

            {/* Error / hint */}
            {err && (
              <div className="mt-4 w-full max-w-xl rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
                {err}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && !selected && (
              <div className="mt-4 w-full max-w-xl rounded-2xl bg-white p-2 ring-1 ring-brand-200 backdrop-blur">
                <div className="px-2 pb-2 text-xs font-medium text-brand-700">Select a city</div>
                <ul className="max-h-56 overflow-auto">
                  {results.map((r) => (
                    <li key={`${r.lat},${r.lon},${r.name}`}>
                      <button
                        type="button"
                        onClick={() => onSelect(r)}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-brand-900 transition hover:bg-brand-50"
                      >
                        <div className="font-medium">
                          {r.name}
                          {r.state ? `, ${r.state}` : ""} — {r.country}
                        </div>
                        <div className="text-xs text-brand-700/80">
                          lat {r.lat}, lon {r.lon}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Basic info */}
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
                <span
                  className={`inline-flex items-center rounded-full px-4 py-1.5 text-base font-semibold ring-1 ${meta!.badge}`}
                >
                    {air.aqi_ow_1_5} — {meta!.label}
                  </span>
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

