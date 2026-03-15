import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  getLocationSelectionFromParams,
  parseNumberOrNull,
} from "../lib/locationSelection";
import type { HistoryDays } from "../components/HistoryPanel";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;

function clampDays(value: number, min: number, max: number, fallback: number) {
  const n = Math.floor(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function useArchiveParams() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const selection = getLocationSelectionFromParams(params, "Selected location");

  const rawDays = parseNumberOrNull(params.get("days"));
  const historyDays = clampDays(
    rawDays ?? DEFAULT_DAYS,
    1,
    MAX_DAYS,
    DEFAULT_DAYS
  ) as HistoryDays;

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void, replace = true) => {
      const next = new URLSearchParams(params);
      updater(next);
      navigate({ search: next.toString() }, { replace });
    },
    [params, navigate]
  );

  useEffect(() => {
    if (!selection) return;

    const parsed = parseNumberOrNull(params.get("days"));
    const clamped = clampDays(parsed ?? DEFAULT_DAYS, 1, MAX_DAYS, DEFAULT_DAYS);

    if (params.get("days") == null || parsed == null || clamped !== parsed) {
      updateSearchParams((next) => next.set("days", String(clamped)));
    }
  }, [selection, params, updateSearchParams]);

  const setHistoryDays = useCallback(
    (nextDays: HistoryDays) => {
      const value = clampDays(Number(nextDays), 1, MAX_DAYS, DEFAULT_DAYS);
      updateSearchParams((next) => next.set("days", String(value)));
    },
    [updateSearchParams]
  );

  return {
    selection,
    historyDays,
    setHistoryDays,
    navigate,
    DEFAULT_DAYS,
    MAX_DAYS,
  };
}