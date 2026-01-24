import { useState } from "react";
import lookupBg from "../assets/lookup-bg.png";

export default function CityLookup() {
  const [city, setCity] = useState("");

  return (
    <section id="lookup" className="mt-2 scroll-mt-35">
      <div className="group relative flex min-h-[70vh] items-center overflow-hidden rounded-3xl ring-1 ring-brand-300/50 shadow-[0_20px_50px_-20px_rgba(15,58,87,0.35)] transition hover:-translate-y-1 hover:shadow-[0_32px_80px_-32px_rgba(15,58,87,0.65)]">
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
                  placeholder="e.g., Tbilisi"
                  className="h-11 w-full bg-transparent px-3 text-base outline-none placeholder:text-brand-900/50"
                />

                <button
                  type="button"
                  className="h-11 shrink-0 rounded-xl bg-brand-900 px-6 text-base font-medium text-brand-50 transition hover:bg-brand-700"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
