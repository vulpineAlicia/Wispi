import { useState } from "react";
import { geocodeCity } from "../lib/api";
import type { GeoResult } from "../lib/api";
import useAsync from "../hooks/useAsync";

type Props = {
  onSelect: (place: GeoResult) => void | Promise<void>;
  placeholder?: string;
  buttonText?: string;
  disabled?: boolean;
};

export default function CitySearchBox({
  onSelect,
  placeholder = "e.g., Tbilisi",
  buttonText = "Search",
  disabled = false,
}: Props) {
  const [city, setCity] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  const geo = useAsync<GeoResult[]>();

  const loading = geo.loading || disabled;
  const err = geo.error;

  async function onSearch() {
    setHint(null);

    const q = city.trim();
    if (!q) return;

    const r = await geo.run(
      () => geocodeCity(q),
      "Could not search cities (backend unavailable?)"
    );

    if (r && r.length === 0) setHint("No matches found. Try a different spelling.");
  }

  const results = geo.data ?? [];

  return (
    <>
      <div className="w-full rounded-2xl bg-white p-2 ring-1 ring-brand-200">
        <label className="sr-only" htmlFor="city-input">
          City name
        </label>

        <div className="flex items-center gap-2">
          <input
            id="city-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder={placeholder}
            disabled={loading}
            className="h-11 w-full bg-transparent px-3 text-base outline-none placeholder:text-brand-900/50 disabled:opacity-60"
          />

          <button
            type="button"
            onClick={onSearch}
            disabled={loading}
            className="h-11 shrink-0 rounded-xl bg-brand-900 px-6 text-base font-medium text-brand-50 transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Loading…" : buttonText}
          </button>
        </div>
      </div>

      {(err || hint) && (
        <div className="mt-4 w-full rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          {err ?? hint}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 w-full rounded-2xl bg-white p-2 ring-1 ring-brand-200 backdrop-blur">
          <div className="px-2 pb-2 text-xs font-medium text-brand-700">Select a city</div>
          <ul className="max-h-56 overflow-auto">
            {results.map((r) => (
              <li key={`${r.lat},${r.lon},${r.name}`}>
                <button
                  type="button"
                  onClick={async () => {
                    // hide results immediately (optional)
                    geo.setData([]);
                    await onSelect(r);
                  }}
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
    </>
  );
}
