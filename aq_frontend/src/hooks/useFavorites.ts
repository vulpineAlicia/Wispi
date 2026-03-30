import { useContext } from "react";
import { FavoritesContext } from "../contexts/favoritesContextDef";
import type { FavoritesContextValue } from "../contexts/favoritesContextDef";

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
}
