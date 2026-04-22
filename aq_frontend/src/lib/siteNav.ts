import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type RoutePath = "/" | "/map" | "/archive" | "/info" | "/favorites";
export type NavTarget = RoutePath | `/${string}` | `#${string}`;

export type NavLinkItem = {
  label: string;
  to: NavTarget;
};

export const HEADER_LINKS: NavLinkItem[] = [
  { label: "nav.lookUpCity", to: "/" },
  { label: "nav.features", to: "/#features" },
  { label: "nav.map", to: "/map" },
  { label: "nav.archive", to: "/archive" },
  { label: "nav.usefulInfo", to: "/info" },
  { label: "nav.favourites", to: "/favorites" },
  { label: "nav.contacts", to: "#contacts" },
];

export const FOOTER_LINKS: NavLinkItem[] = [
  { label: "nav.home", to: "/" },
  { label: "nav.map", to: "/map" },
  { label: "nav.archive", to: "/archive" },
  { label: "nav.usefulInfo", to: "/info" },
  { label: "nav.favourites", to: "/favorites" },
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