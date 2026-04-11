import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "../hooks/useAuth";
import { coordsMatch } from "../lib/locationSelection";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  type FavoriteCity,
} from "../lib/services/favoritesApi";
import { FavoritesContext } from "./favoritesContextDef";

const MAX_FAVORITES = 10;

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, getToken } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setError(null);
      return;
    }

    const token = getToken();
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    getFavorites(token)
      .then((data) => { if (!cancelled) setFavorites(data); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load favourites.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user, getToken]);

  const isFavorite = useCallback(
    (lat: number, lon: number) =>
      favorites.some((f) => coordsMatch(f.lat, f.lon, lat, lon)),
    [favorites]
  );

  const getFavoriteId = useCallback(
    (lat: number, lon: number) =>
      favorites.find((f) => coordsMatch(f.lat, f.lon, lat, lon))?.id,
    [favorites]
  );

  const add = useCallback(
    async (city: Omit<FavoriteCity, "id">) => {
      const token = getToken();
      if (!token) return;
      const saved = await addFavorite(city, token);
      setFavorites((prev) => [...prev, saved]);
    },
    [getToken]
  );

  const remove = useCallback(
    async (id: string) => {
      const token = getToken();
      if (!token) return;
      await removeFavorite(id, token);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    },
    [getToken]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        error,
        canAdd: favorites.length < MAX_FAVORITES,
        isFavorite,
        getFavoriteId,
        add,
        remove,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
