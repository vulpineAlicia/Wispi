import { useCallback, useEffect, useReducer } from "react";
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

type State = {
  items: FavoriteCity[];
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "loading" }
  | { type: "loaded"; items: FavoriteCity[] }
  | { type: "error"; message: string }
  | { type: "add"; item: FavoriteCity }
  | { type: "remove"; id: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading": return { ...state, loading: true, error: null };
    case "loaded": return { items: action.items, loading: false, error: null };
    case "error": return { ...state, loading: false, error: action.message };
    case "add": return { ...state, items: [...state.items, action.item] };
    case "remove": return { ...state, items: state.items.filter((f) => f.id !== action.id) };
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, getToken } = useAuth();
  const [state, dispatch] = useReducer(reducer, { items: [], loading: false, error: null });

  useEffect(() => {
    if (!user) return;

    const token = getToken();
    if (!token) return;

    let cancelled = false;
    dispatch({ type: "loading" });
    getFavorites(token)
      .then((data) => { if (!cancelled) dispatch({ type: "loaded", items: data }); })
      .catch((err: unknown) => {
        if (!cancelled) dispatch({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to load favourites.",
        });
      });

    return () => { cancelled = true; };
  }, [user, getToken]);

  const isFavorite = useCallback(
    (lat: number, lon: number) =>
      state.items.some((f) => coordsMatch(f.lat, f.lon, lat, lon)),
    [state.items]
  );

  const getFavoriteId = useCallback(
    (lat: number, lon: number) =>
      state.items.find((f) => coordsMatch(f.lat, f.lon, lat, lon))?.id,
    [state.items]
  );

  const add = useCallback(
    async (city: Omit<FavoriteCity, "id">) => {
      const token = getToken();
      if (!token) return;
      const saved = await addFavorite(city, token);
      dispatch({ type: "add", item: saved });
    },
    [getToken]
  );

  const remove = useCallback(
    async (id: string) => {
      const token = getToken();
      if (!token) return;
      await removeFavorite(id, token);
      dispatch({ type: "remove", id });
    },
    [getToken]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites: user ? state.items : [],
        loading: state.loading,
        error: user ? state.error : null,
        canAdd: state.items.length < MAX_FAVORITES,
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
