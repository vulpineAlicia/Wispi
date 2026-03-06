import { useCallback, useRef, useState } from "react";

export type LatestRequestState<T> = {
  data: T | null;
  loading: boolean;
  error: unknown | null;
  execute: (fn: (signal: AbortSignal) => Promise<T>) => Promise<T | null>;
  clear: () => void;
};

export function useLatestRequest<T>(): LatestRequestState<T> {
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const clear = useCallback(() => {
    requestIdRef.current += 1;

    controllerRef.current?.abort();
    controllerRef.current = null;

    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const execute = useCallback(
    async (fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
      const id = ++requestIdRef.current;

      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const result = await fn(controller.signal);

        if (requestIdRef.current !== id) return null;
        if (controller.signal.aborted) return null;

        setData(result);
        return result;
      } catch (e: unknown) {
        if (requestIdRef.current !== id) return null;
        if (controller.signal.aborted) return null;
        if (e instanceof DOMException && e.name === "AbortError") return null;

        setError(e);
        setData(null);
        return null;
      } finally {
        if (requestIdRef.current === id) {
          setLoading(false);
        }

        if (controllerRef.current === controller) {
          controllerRef.current = null;
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