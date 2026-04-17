import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type RoutePath = "/" | "/map" | "/archive" | "/info" | "/favorites";
export type NavTarget = RoutePath | `/${string}` | `#${string}`;

export type NavLinkItem = {
  label: string;
  to: NavTarget;
};

export const HEADER_LINKS: NavLinkItem[] = [
  { label: "Look up your city", to: "/" },
  { label: "Features", to: "/#features" },
  { label: "Map", to: "/map" },
  { label: "Archive", to: "/archive" },
  { label: "Useful info", to: "/info" },
  { label: "Favourites", to: "/favorites" },
  { label: "Contacts", to: "#contacts" },
];

export const FOOTER_LINKS: Array<{ label: string; to: RoutePath }> = [
  { label: "Home", to: "/" },
  { label: "Map", to: "/map" },
  { label: "Archive", to: "/archive" },
  { label: "Useful info", to: "/info" },
  { label: "Favourites", to: "/favorites" },
];

export function scrollTopSmooth() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function scrollToHash(hash: string) {
  if (!hash) return false;

  const el = document.querySelector(hash);
  if (!(el instanceof HTMLElement)) return false;

  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function useNavScroll() {
  const location = useLocation();
  const navigate = useNavigate();
  const skipRef = useRef(false);

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }

    const scrollTarget = location.hash || location.state?.scrollTo;

    if (scrollTarget) {
      if (scrollToHash(scrollTarget)) {
        if (location.state?.scrollTo) {
          skipRef.current = true;
          navigate(location.pathname, { replace: true, state: null });
        }
        return;
      }
    }

    scrollTopSmooth();
  }, [location.pathname, location.hash, location.state?.scrollTo, navigate]);
}