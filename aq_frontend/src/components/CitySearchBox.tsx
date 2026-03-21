import { useState } from "react";
import { geocodeCity, type GeoResult } from "../lib/services/api";
import { getUserMessage } from "../lib/services/apiMessages";
import { useLatestRequest } from "../hooks/useLatestRequest";
import Bubble from "./Bubble";
import BaseButton from "../components/BaseButton";

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

  const geo = useLatestRequest<GeoResult[]>();

  const isBusy = geo.loading;
  const isDisabled = disabled || isBusy;
  const results = geo.data ?? [];

  async function onSearch() {
    if (isDisabled) return;

    const q = city.trim();
    if (!q) return;

    setHint(null);

    const result = await geo.execute((signal) => geocodeCity(q, signal));
    if (result && result.length === 0) {
      setHint("No matches found. Try a different spelling.");
    }
  }

  const errorMsg = geo.error ? getUserMessage(geo.error) : null;
  const hintMsg = !geo.error ? hint : null;

  return (
    <>
      <Bubble className="p-2">
        <label className="sr-only" htmlFor="city-input">
          City name
        </label>

        <div className="flex items-center gap-2">
          <input
            id="city-input"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              if (hint) setHint(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void onSearch();
              }
            }}
            placeholder={placeholder}
            disabled={isDisabled}
            className="h-12 w-full bg-transparent px-4 text-base outline-none placeholder:text-brand-900/50"
          />

          <BaseButton
            type="button"
            onClick={() => {
              void onSearch();
            }}
            disabled={isDisabled}
            className="h-12 shrink-0 px-6 text-base"
          >
            {isBusy ? "Loading…" : buttonText}
          </BaseButton>
        </div>
      </Bubble>

      {errorMsg && (
        <Bubble tone="error" className="mt-4 w-full px-4 py-3 text-sm">
          {errorMsg}
        </Bubble>
      )}

      {hintMsg && (
        <Bubble tone="brand" className="mt-4 w-full px-4 py-3 text-sm text-brand-900">
          {hintMsg}
        </Bubble>
      )}

      {results.length > 0 && (
        <Bubble className="mt-4 w-full p-3 backdrop-blur">
          <div className="px-2 pb-3 text-xs font-medium text-brand-700">
            Select a city
          </div>

          <ul className="max-h-56 overflow-auto">
            {results.map((r) => (
              <li key={`${r.lat},${r.lon},${r.name}`}>
                <button
                  type="button"
                  onClick={async () => {
                    if (isDisabled) return;
                    setHint(null);
                    geo.clear();
                    await onSelect(r);
                  }}
                  className="w-full rounded-2xl px-3 py-3 text-left text-sm text-brand-900 transition hover:bg-brand-50"
                >
                  <div className="font-medium">
                    {r.name}
                    {r.state ? `, ${r.state}` : ""} — {r.country}
                  </div>
                  <div className="mt-1 text-xs text-brand-700/80">
                    lat {r.lat}, lon {r.lon}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Bubble>
      )}
    </>
  );
}