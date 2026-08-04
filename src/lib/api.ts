// src/lib/api.ts
export function getAuthHeaders() {
  const token = localStorage.getItem('reviewrescue_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const headers = getAuthHeaders();
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });
  return response;
}