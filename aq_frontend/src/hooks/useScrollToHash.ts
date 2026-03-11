import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type ScrollState = {
  scrollToId?: string;
  scrollToTop?: boolean;
};

const MAX_TRIES = 20;

function scrollTopSmooth() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollIntoViewById(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

function scrollIntoViewByHash(hash: string) {
  if (!hash) return false;
  const el = document.querySelector(hash);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function useScrollToHash() {
  const location = useLocation();
  const navigate = useNavigate();
  const skipNextDefaultScrollRef = useRef(false);

  useEffect(() => {
    const st = (location.state ?? {}) as ScrollState;

    const clearState = () => {
      skipNextDefaultScrollRef.current = true;
      navigate(".", { replace: true, state: {} });
    };

    const tryScrollToIdWithRetry = (id: string) => {
      let tries = 0;

      const tick = () => {
        if (scrollIntoViewById(id)) {
          clearState();
          return;
        }

        tries += 1;
        if (tries >= MAX_TRIES) {
          scrollTopSmooth();
          clearState();
          return;
        }

        requestAnimationFrame(tick);
      };

      tick();
    };

    requestAnimationFrame(() => {
      // home page sections
      if (st.scrollToTop) {
        scrollTopSmooth();
        clearState();
        return;
      }

      if (st.scrollToId) {
        if (st.scrollToId === "top") {
          scrollTopSmooth();
          clearState();
          return;
        }

        tryScrollToIdWithRetry(st.scrollToId);
        return;
      }

      // do nothing after state clear
      if (skipNextDefaultScrollRef.current) {
        skipNextDefaultScrollRef.current = false;
        return;
      }

      // hash
      if (scrollIntoViewByHash(location.hash)) return;

      // default scroll to top
      scrollTopSmooth();
    });
  }, [location.key, location.hash, location.state, navigate]);
}