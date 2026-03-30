import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "../hooks/useAuth";
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

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const token = getToken();
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    getFavorites(token)
      .then((data) => { if (!cancelled) setFavorites(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user, getToken]);

  const isFavorite = useCallback(
    (lat: number, lon: number) =>
      favorites.some(
        (f) => Math.abs(f.lat - lat) < 0.001 && Math.abs(f.lon - lon) < 0.001
      ),
    [favorites]
  );

  const getFavoriteId = useCallback(
    (lat: number, lon: number) =>
      favorites.find(
        (f) => Math.abs(f.lat - lat) < 0.001 && Math.abs(f.lon - lon) < 0.001
      )?.id,
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
