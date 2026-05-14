import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useFavorites } from "../hooks/useFavorites";
import { useAirHistory } from "../hooks/useAirHistory";
import type { FavoriteCity } from "../api/favoritesApi";
import { buildMapUrl } from "../lib/locationSelection";
import { countryName } from "../lib/countryName";
import AqiPill from "../components/shared/AqiPill";
import FavoriteButton from "../components/shared/FavoriteButton";
import Bubble from "../components/templates/Bubble";

function FavoriteCityCard({ city }: { city: FavoriteCity }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const history = useAirHistory(city.lat, city.lon, 1);
  const aqi = history.model.latestPanel?.aqi ?? null;

  const mapUrl = buildMapUrl({ lat: city.lat, lon: city.lon, name: city.name, country: city.country ?? undefined });

  return (
    <Bubble className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-brand-900">
            {city.name}
            {city.country ? `, ${countryName(city.country, i18n.language)}` : ""}
          </div>
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
        {history.loading ? (
          <span className="text-sm text-brand-500">{t('favorites.loading')}</span>
        ) : aqi != null ? (
          <AqiPill aqi={aqi} />
        ) : (
          <span className="text-sm text-brand-500">{t('favorites.noData')}</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate(mapUrl)}
        className="mt-auto self-start rounded-2xl bg-brand-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-brand-700"
      >
        {t('favorites.viewOnMap')}
      </button>
    </Bubble>
  );
}

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { favorites, loading } = useFavorites();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-8 pt-6 text-brand-900">
      <div className="mt-6 md:rounded-3xl md:border md:border-brand-200 md:bg-brand-50 md:p-10 md:shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t('favorites.title')}
        </h1>
        <p className="mt-2 text-base text-brand-700">
          {favorites.length === 0
            ? t('favorites.noSaved')
            : t('favorites.citiesSaved', { total: favorites.length })}
        </p>

        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-brand-700">{t('favorites.loading')}</div>
          ) : favorites.length === 0 ? (
            <p className="text-center text-xl text-brand-700">
              {t('favorites.addHint')}{" "}
              <span className="text-rose-400">♥</span>
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favorites.map((city) => (
                <FavoriteCityCard key={city.id} city={city} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
