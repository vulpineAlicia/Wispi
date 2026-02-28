import { useCallback, useRef, useState } from "react";

export type LatestRequestState<T> = {
  data: T | null;
  loading: boolean;
  error: unknown | null;
  run: (fn: () => Promise<T>) => void;
  reset: () => void;
};

export function useLatestRequest<T>(): LatestRequestState<T> {
  const reqIdRef = useRef(0);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const reset = useCallback(() => {
    reqIdRef.current += 1;
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const run = useCallback((fn: () => Promise<T>) => {
    const id = ++reqIdRef.current;

    setLoading(true);
    setError(null);

    fn()
      .then((result) => {
        if (reqIdRef.current !== id) return;
        setData(result);
      })
      .catch((e: unknown) => {
        if (reqIdRef.current !== id) return;

        setError(e);
        setData(null);
      })
      .finally(() => {
        if (reqIdRef.current !== id) return;
        setLoading(false);
      });
  }, []);

  return { data, loading, error, run, reset };
}