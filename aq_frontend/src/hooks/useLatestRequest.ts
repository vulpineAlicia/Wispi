import { useCallback, useRef, useState } from "react";

export type LatestRequestState<T> = {
  data: T | null;
  loading: boolean;
  error: unknown | null;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  clear: () => void;
};

export function useLatestRequest<T>(): LatestRequestState<T> {
  const requestIdRef = useRef(0);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  // invalidate in-flight requests and clear local state
  const clear = useCallback(() => {
    requestIdRef.current += 1;
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | null> => {
      const id = ++requestIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const result = await fn();

        // ignore stale results
        if (requestIdRef.current !== id) return null;

        setData(result);
        return result;
      } catch (e: unknown) {
        if (requestIdRef.current !== id) return null;

        setError(e);
        setData(null);
        return null;
      } finally {
        if (requestIdRef.current === id) {
          setLoading(false);
        }
      }
    },
    []
  );

  return {
    data,
    loading,
    error,
    execute,
    clear,
  };
}