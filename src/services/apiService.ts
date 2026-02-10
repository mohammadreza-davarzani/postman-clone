import { refreshAuthToken, clearAuthStorage, AUTH_TOKEN_KEY } from "../contexts/AuthContext";

const PROXY_URL =
  (typeof window !== "undefined" &&
    (window as { __PROXY_URL?: string }).__PROXY_URL) ??
  (typeof import.meta.env?.VITE_PROXY_URL === "string"
    ? import.meta.env.VITE_PROXY_URL
    : "https://postwomanbackend.liara.run");

function getAuthHeaders() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchWithAuth(
  url: string,
  options: RequestInit & { _retry?: boolean } = {}
): Promise<Response> {
  const { _retry, ...init } = options;
  const headers = new Headers(init.headers);
  const authHeaders = getAuthHeaders();
  Object.entries(authHeaders).forEach(([k, v]) => headers.set(k, v));
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && !_retry) {
    const newToken = await refreshAuthToken();
    if (newToken) {
      return fetchWithAuth(url, { ...init, _retry: true });
    }
    clearAuthStorage();
    window.dispatchEvent(new CustomEvent("auth-logout"));
  }
  return res;
}

// Collections
export async function fetchCollections() {
  const response = await fetchWithAuth(`${PROXY_URL}/api/collections`);
  if (!response.ok) throw new Error("Failed to fetch collections");
  return response.json();
}

export async function createCollection(name: string, items: unknown) {
  const response = await fetchWithAuth(`${PROXY_URL}/api/collections`, {
    method: "POST",
    body: JSON.stringify({ name, items }),
  });
  if (!response.ok) throw new Error("Failed to create collection");
  return response.json();
}

export async function updateCollection(
  id: number,
  name: string,
  items: unknown,
) {
  const response = await fetchWithAuth(`${PROXY_URL}/api/collections/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, items }),
  });
  if (!response.ok) throw new Error("Failed to update collection");
  return response.json();
}

export async function deleteCollection(id: number) {
  const response = await fetchWithAuth(`${PROXY_URL}/api/collections/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete collection");
  return response.json();
}

// Environments
export async function fetchEnvironments() {
  const response = await fetchWithAuth(`${PROXY_URL}/api/environments`);
  if (!response.ok) throw new Error("Failed to fetch environments");
  return response.json();
}

export async function createEnvironment(name: string, variables: unknown) {
  const response = await fetchWithAuth(`${PROXY_URL}/api/environments`, {
    method: "POST",
    body: JSON.stringify({ name, variables }),
  });
  if (!response.ok) throw new Error("Failed to create environment");
  return response.json();
}

export async function updateEnvironment(
  id: number,
  name: string,
  variables: unknown,
) {
  const response = await fetchWithAuth(`${PROXY_URL}/api/environments/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, variables }),
  });
  if (!response.ok) throw new Error("Failed to update environment");
  return response.json();
}

export async function deleteEnvironment(id: number) {
  const response = await fetchWithAuth(`${PROXY_URL}/api/environments/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete environment");
  return response.json();
}
