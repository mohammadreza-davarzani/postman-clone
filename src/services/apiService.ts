const PROXY_URL =
  (typeof window !== "undefined" &&
    (window as { __PROXY_URL?: string }).__PROXY_URL) ??
  (typeof import.meta.env?.VITE_PROXY_URL === "string"
    ? import.meta.env.VITE_PROXY_URL
    : "https://postwomanbackend.liara.run/");

function getAuthHeaders() {
  const token = localStorage.getItem("auth-token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Collections
export async function fetchCollections() {
  const response = await fetch(`${PROXY_URL}/api/collections`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch collections");
  return response.json();
}

export async function createCollection(name: string, items: unknown) {
  const response = await fetch(`${PROXY_URL}/api/collections`, {
    method: "POST",
    headers: getAuthHeaders(),
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
  const response = await fetch(`${PROXY_URL}/api/collections/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, items }),
  });
  if (!response.ok) throw new Error("Failed to update collection");
  return response.json();
}

export async function deleteCollection(id: number) {
  const response = await fetch(`${PROXY_URL}/api/collections/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete collection");
  return response.json();
}

// Environments
export async function fetchEnvironments() {
  const response = await fetch(`${PROXY_URL}/api/environments`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch environments");
  return response.json();
}

export async function createEnvironment(name: string, variables: unknown) {
  const response = await fetch(`${PROXY_URL}/api/environments`, {
    method: "POST",
    headers: getAuthHeaders(),
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
  const response = await fetch(`${PROXY_URL}/api/environments/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, variables }),
  });
  if (!response.ok) throw new Error("Failed to update environment");
  return response.json();
}

export async function deleteEnvironment(id: number) {
  const response = await fetch(`${PROXY_URL}/api/environments/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete environment");
  return response.json();
}
