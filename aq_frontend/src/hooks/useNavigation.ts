import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "./useAuth";
import { scrollToHash, scrollTopSmooth, type NavTarget } from "../lib/siteNav";

function scrollOrTop(hash: string) {
  if (!scrollToHash(hash)) scrollTopSmooth();
}

export function useNavigation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function navigateTo(target: NavTarget) {
    // Protected route: redirect to auth if not signed in
    if (target === "/favorites" && !user) {
      if (location.pathname === "/auth") scrollTopSmooth();
      else navigate("/auth");
      return;
    }

    // Hash-only anchor on the current page (e.g. "#contacts")
    if (target.startsWith("#")) {
      scrollOrTop(target);
      return;
    }

    const [pathname, hash = ""] = target.split("#");
    const nextHash = hash ? `#${hash}` : "";

    if (location.pathname === pathname) {
      if (nextHash) scrollOrTop(nextHash);
      else scrollTopSmooth();
      return;
    }

    if (nextHash) {
      navigate(pathname, { state: { scrollTo: nextHash } });
    } else {
      navigate(pathname);
    }
  }

  function navigateToProfile() {
    const target = user ? "/profile" : "/auth";
    if (location.pathname === target) {
      scrollTopSmooth();
      return;
    }
    navigate(target);
  }

  return { navigateTo, navigateToProfile };
}
