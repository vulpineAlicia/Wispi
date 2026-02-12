import { useState } from "react";

export default function useAsync<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<T>, errorMsg = "Request failed") {
    setLoading(true);
    setError(null);

    try {
      const result = await fn();
      setData(result);
      return result;
    } catch {
      setError(errorMsg);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { data, setData, loading, error, run };
}