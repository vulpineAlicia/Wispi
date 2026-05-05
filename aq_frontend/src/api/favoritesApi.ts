import { authHeader, deleteJson, getJson, postJson } from "./apiClient";

export type FavoriteCity = {
  id: string;
  name: string;
  country: string | null;
  lat: number;
  lon: number;
};

export type FavoritesListResponse = {
  items: FavoriteCity[];
  max: number;
};

export async function getFavorites(token: string, lang: string = "en", signal?: AbortSignal): Promise<FavoritesListResponse> {
  const qs = new URLSearchParams({ lang });
  return getJson<FavoritesListResponse>(`/favorites?${qs.toString()}`, {
    headers: authHeader(token),
    signal,
  });
}

export async function addFavorite(
  city: Omit<FavoriteCity, "id">,
  token: string
): Promise<FavoriteCity> {
  return postJson<FavoriteCity>("/favorites", city, {
    headers: authHeader(token),
  });
}

export async function removeFavorite(id: string, token: string): Promise<void> {
  await deleteJson<unknown>(`/favorites/${id}`, {
    headers: authHeader(token),
  });
}
