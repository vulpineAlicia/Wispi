import { useEffect, useRef } from "react";
import type { Location, NavigateFunction } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";

export type RoutePath = "/" | "/map" | "/archive" | "/info";

export type NavItem =
  | {
      kind: "route";
      label: string;
      to: RoutePath;
    }
  | {
      kind: "section";
      label: string;
      to: RoutePath;
      sectionId?: string;
    }
  | {
      kind: "action";
      label: string;
      action: "scroll-bottom";
    };

export type ScrollState =
  | { kind: "top" }
  | { kind: "bottom" }
  | { kind: "id"; id: string };

export const HEADER_LINKS: NavItem[] = [
  { kind: "section", label: "Look up your city", to: "/" },
  { kind: "section", label: "Features", to: "/", sectionId: "features" },
  { kind: "route", label: "Map", to: "/map" },
  { kind: "route", label: "Archive", to: "/archive" },
  { kind: "route", label: "Useful info", to: "/info" },
  { kind: "action", label: "Contacts", action: "scroll-bottom" },
];

export const FOOTER_LINKS: Array<{ label: string; to: RoutePath }> = [
  { label: "Home", to: "/" },
  { label: "Map", to: "/map" },
  { label: "Archive", to: "/archive" },
  { label: "Useful info", to: "/info" },
];

const MAX_SCROLL_TRIES = 20;

export function scrollTopSmooth() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function scrollBottomSmooth() {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "smooth",
  });
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;

  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function scrollToHash(hash: string) {
  if (!hash) return false;

  const el = document.querySelector(hash);
  if (!(el instanceof HTMLElement)) return false;

  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

function scrollStateForSection(sectionId?: string): ScrollState {
  return sectionId ? { kind: "id", id: sectionId } : { kind: "top" };
}

export function navigateToNavItem(
  item: NavItem,
  location: Location,
  navigate: NavigateFunction,
  onDone?: () => void
) {
  if (item.kind === "route") {
    if (location.pathname === item.to) {
      scrollTopSmooth();
    } else {
      navigate(item.to);
    }

    onDone?.();
    return;
  }

  if (item.kind === "action") {
    if (item.action === "scroll-bottom") {
      scrollBottomSmooth();
    }

    onDone?.();
    return;
  }

  if (location.pathname !== item.to) {
    navigate(item.to, {
      state: scrollStateForSection(item.sectionId),
    });

    onDone?.();
    return;
  }

  if (!item.sectionId) {
    scrollTopSmooth();
    onDone?.();
    return;
  }

  if (!scrollToId(item.sectionId)) {
    scrollTopSmooth();
  }

  onDone?.();
}

export function navigateHomeTop(
  location: Location,
  navigate: NavigateFunction,
  onDone?: () => void
) {
  if (location.pathname === "/") {
    scrollTopSmooth();
  } else {
    navigate("/", { state: { kind: "top" } satisfies ScrollState });
  }

  onDone?.();
}

export function useNavScroll() {
  const location = useLocation();
  const navigate = useNavigate();
  const skipNextDefaultScrollRef = useRef(false);

  useEffect(() => {
    const state = location.state as ScrollState | null | undefined;

    const clearState = () => {
      skipNextDefaultScrollRef.current = true;
      navigate(".", { replace: true, state: null });
    };

    const tryScrollToId = (id: string) => {
      let tries = 0;

      const tick = () => {
        if (scrollToId(id)) {
          clearState();
          return;
        }

        tries += 1;

        if (tries >= MAX_SCROLL_TRIES) {
          scrollTopSmooth();
          clearState();
          return;
        }

        requestAnimationFrame(tick);
      };

      tick();
    };

    requestAnimationFrame(() => {
      if (state?.kind === "top") {
        scrollTopSmooth();
        clearState();
        return;
      }

      if (state?.kind === "bottom") {
        scrollBottomSmooth();
        clearState();
        return;
      }

      if (state?.kind === "id") {
        tryScrollToId(state.id);
        return;
      }

      if (skipNextDefaultScrollRef.current) {
        skipNextDefaultScrollRef.current = false;
        return;
      }

      if (scrollToHash(location.hash)) return;

      scrollTopSmooth();
    });
  }, [location.key, location.hash, location.state, navigate]);
}