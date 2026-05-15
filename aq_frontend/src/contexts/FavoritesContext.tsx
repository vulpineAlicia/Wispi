import { useCallback, useEffect, useReducer } from "react";
import type { ReactNode } from "react";

import { useAuth } from "../hooks/useAuth";
import { coordsMatch } from "../lib/locationSelection";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  type FavoriteCity,
} from "../api/favoritesApi";
import { FavoritesContext } from "./favoritesContextDef";

type State = {
  items: FavoriteCity[];
  max: number;
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "loading" }
  | { type: "loaded"; items: FavoriteCity[]; max: number }
  | { type: "error"; message: string }
  | { type: "add"; item: FavoriteCity }
  | { type: "remove"; id: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading": return { ...state, loading: true, error: null };
    case "loaded": return { items: action.items, max: action.max, loading: false, error: null };
    case "error": return { ...state, loading: false, error: action.message };
    case "add": return { ...state, items: [...state.items, action.item] };
    case "remove": return { ...state, items: state.items.filter((f) => f.id !== action.id) };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, getToken } = useAuth();
  const [state, dispatch] = useReducer(reducer, { items: [], max: 0, loading: false, error: null });

  useEffect(() => {
    if (!user) return;

    const token = getToken();
    if (!token) return;

    const controller = new AbortController();
    dispatch({ type: "loading" });
    getFavorites(token, controller.signal)
      .then((data) => dispatch({ type: "loaded", items: data.items, max: data.max }))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) dispatch({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to load favourites.",
        });
      });

    return () => controller.abort();
  }, [user, getToken]);

  const findFavorite = useCallback(
    (lat: number, lon: number) =>
      state.items.find((f) => coordsMatch(f.lat, f.lon, lat, lon)),
    [state.items]
  );

  const isFavorite = useCallback(
    (lat: number, lon: number) => !!findFavorite(lat, lon),
    [findFavorite]
  );

  const getFavoriteId = useCallback(
    (lat: number, lon: number) => findFavorite(lat, lon)?.id,
    [findFavorite]
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
        canAdd: state.max === 0 || state.items.length < state.max,
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
