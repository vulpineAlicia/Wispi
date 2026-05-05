import { ApiError } from "./apiError";
import { isRecord } from "./apiGuards";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

async function safeReadJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function getHeaderRequestId(res: Response): string | undefined {
  return res.headers.get("x-request-id") ?? undefined;
}

export function invalidResponse(message: string, requestId?: string): ApiError {
  return new ApiError(message, 0, "INVALID_RESPONSE", requestId);
}

export async function postJson<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const hasBody = body !== undefined;
  return getJson<T>(path, {
    method: "POST",
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
    credentials: "include",
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

export async function deleteJson<T>(path: string, init?: RequestInit): Promise<T> {
  return getJson<T>(path, {
    method: "DELETE",
    credentials: "include",
    ...init,
  });
}

export async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      credentials: "include",
      ...init,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Network error. Please check your connection.",
      0,
      "NETWORK_ERROR"
    );
  }

  const headerRid = getHeaderRequestId(res);

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    let requestId: string | undefined = headerRid;

    const body = await safeReadJson(res);
    if (isRecord(body)) {
      if (typeof body.message === "string") message = body.message;
      if (typeof body.code === "string") code = body.code;
      if (typeof body.request_id === "string") requestId = body.request_id;
    }

    code ??= `HTTP_${res.status}`;
    throw new ApiError(message, res.status, code, requestId);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(
      "Server returned an invalid JSON response.",
      res.status,
      "INVALID_JSON",
      headerRid
    );
  }
}