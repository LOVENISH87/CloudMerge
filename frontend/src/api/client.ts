const API_URL = import.meta.env.VITE_API_URL as string;

let accessToken: string | null = null;
let onAuthLost: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnAuthLost(fn: () => void) {
  onAuthLost = fn;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;

  const data = await res.json();
  accessToken = data.accessToken;
  localStorage.setItem("refreshToken", data.refreshToken);
  return true;
}

interface ApiOptions extends RequestInit {
  skipAuthRetry?: boolean;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !options.skipAuthRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) return api<T>(path, { ...options, skipAuthRetry: true });
    localStorage.removeItem("refreshToken");
    accessToken = null;
    onAuthLost?.();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export { API_URL };
