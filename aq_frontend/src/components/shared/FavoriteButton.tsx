import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";

type Props = {
  name: string;
  country: string | null | undefined;
  lat: number;
  lon: number;
  className?: string;
};

export default function FavoriteButton({ name, country, lat, lon, className = "" }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, getFavoriteId, add, remove, canAdd } = useFavorites();
  const [busy, setBusy] = useState(false);

  const favorited = isFavorite(lat, lon);
  const favoriteId = getFavoriteId(lat, lon);

  async function handleClick() {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (busy) return;
    setBusy(true);

    try {
      if (favorited && favoriteId) {
        await remove(favoriteId);
      } else if (canAdd) {
        await add({ name, country: country ?? null, lat, lon });
      }
    } finally {
      setBusy(false);
    }
  }

  const title = !user
    ? "Sign in to save cities"
    : favorited
      ? "Remove from favourites"
      : !canAdd
        ? "Favourites limit reached (10)"
        : "Add to favourites";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || (!favorited && !canAdd && !!user)}
      title={title}
      aria-label={title}
      className={`flex items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
