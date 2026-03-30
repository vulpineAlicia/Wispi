import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";
import { getAirCurrent } from "../lib/services/api";
import type { FavoriteCity } from "../lib/services/favoritesApi";
import AqiPill from "../components/shared/AqiPill";
import FavoriteButton from "../components/shared/FavoriteButton";
import Bubble from "../components/templates/Bubble";

function FavoriteCityCard({ city }: { city: FavoriteCity }) {
  const navigate = useNavigate();
  const [aqi, setAqi] = useState<number | null>(null);
  const [aqiLoading, setAqiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAirCurrent(city.lat, city.lon)
      .then((data) => { if (!cancelled) setAqi(data.aqi_ow_1_5); })
      .catch(() => { if (!cancelled) setAqi(null); })
      .finally(() => { if (!cancelled) setAqiLoading(false); });
    return () => { cancelled = true; };
  }, [city.lat, city.lon]);

  const mapUrl = `/map?lat=${city.lat}&lon=${city.lon}&name=${encodeURIComponent(city.name)}${city.country ? `&country=${encodeURIComponent(city.country)}` : ""}`;

  return (
    <Bubble className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-brand-900">{city.name}</div>
          {city.country && (
            <div className="mt-0.5 text-xs text-brand-500">{city.country}</div>
          )}
        </div>
        <FavoriteButton
          name={city.name}
          country={city.country}
          lat={city.lat}
          lon={city.lon}
          className="shrink-0 text-rose-400 hover:text-rose-600"
        />
      </div>

      <div className="flex items-center gap-2">
        {aqiLoading ? (
          <span className="text-sm text-brand-500">Loading…</span>
        ) : aqi != null ? (
          <AqiPill aqi={aqi} />
        ) : (
          <span className="text-sm text-brand-500">No data</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate(mapUrl)}
        className="mt-auto self-start rounded-2xl bg-brand-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-brand-700"
      >
        View on map →
      </button>
    </Bubble>
  );
}

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { favorites, loading } = useFavorites();

  if (authLoading) return null;

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 text-brand-900">
      <Bubble tone="brand" className="mt-6 p-6 md:p-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Favourite cities
            </h1>
            <p className="mt-2 text-base text-brand-700">
              {favorites.length === 0
                ? "No saved cities yet."
                : `${favorites.length} / 10 cities saved.`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-brand-700">Loading…</div>
        ) : favorites.length === 0 ? (
          <Bubble className="px-6 py-8 text-center text-sm text-brand-600">
            Add cities from the home, map, or archive pages using the{" "}
            <span className="text-rose-400">♥</span> button.
          </Bubble>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((city) => (
              <FavoriteCityCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </Bubble>
    </main>
  );
}
