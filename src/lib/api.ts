// src/lib/api.ts
// src/lib/api.ts
// src/lib/api.ts

export function getAuthHeaders() {
  let token = localStorage.getItem('reviewrescue_access_token');
  if (!token) {
    token = sessionStorage.getItem('reviewrescue_access_token');
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const authHeaders = getAuthHeaders();
  
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      // ✅ Start with auth headers (Authorization + Content-Type)
      ...authHeaders,
      // ✅ Then merge in any additional headers from options
      ...options.headers,
      // ✅ Ensure Content-Type isn't overwritten if not explicitly provided
      'Content-Type': (options.headers as any)?.['Content-Type'] || authHeaders['Content-Type'] || 'application/json'
    }
  });

  // ─── THROW ON AUTH ERRORS ──────────────────────────────────────────
  if (response.status === 401 || response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Auth failed: ${response.status}`);
  }

  return response;
}