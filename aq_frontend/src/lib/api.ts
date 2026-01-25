const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export async function checkHealth(): Promise<boolean> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(`${API_BASE}/health`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return false;

    const data = (await res.json()) as { status?: string };
    return data.status === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}
