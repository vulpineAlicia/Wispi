import { createContext } from "react";
import type { FavoriteCity } from "../lib/services/favoritesApi";

export type FavoritesContextValue = {
  favorites: FavoriteCity[];
  loading: boolean;
  error: string | null;
  canAdd: boolean;
  isFavorite: (lat: number, lon: number) => boolean;
  getFavoriteId: (lat: number, lon: number) => string | undefined;
  add: (city: Omit<FavoriteCity, "id">) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);
