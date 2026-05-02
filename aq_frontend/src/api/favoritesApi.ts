import { deleteJson, getJson, postJson } from "./apiClient";

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

export async function getFavorites(token: string, signal?: AbortSignal): Promise<FavoritesListResponse> {
  return getJson<FavoritesListResponse>("/favorites", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
}

export async function addFavorite(
  city: Omit<FavoriteCity, "id">,
  token: string
): Promise<FavoriteCity> {
  return postJson<FavoriteCity>("/favorites", city, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function removeFavorite(id: string, token: string): Promise<void> {
  await deleteJson<unknown>(`/favorites/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
