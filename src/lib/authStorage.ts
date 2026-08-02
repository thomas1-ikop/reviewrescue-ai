// src/lib/authStorage.ts

const USER_KEY = 'reviewrescue_user';
const REMEMBER_KEY = 'reviewrescue_remember_me';
const EXPIRY_KEY = 'reviewrescue_remember_expires';
const ACCESS_TOKEN_KEY = 'reviewrescue_access_token';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Updated to store access token
export function persistUserSession(profile: unknown, rememberMe: boolean, accessToken?: string) {
  if (rememberMe) {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    localStorage.setItem(REMEMBER_KEY, 'true');
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + THIRTY_DAYS_MS));
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } else {
    sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
    if (accessToken) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

// Updated to return access token
export function loadPersistedUserSession<T = any>(): { user: T | null; accessToken: string | null } {
  let user = null;
  let accessToken = null;

  // Check localStorage (Remember Me)
  if (localStorage.getItem(REMEMBER_KEY) === 'true') {
    const expiresAt = Number(localStorage.getItem(EXPIRY_KEY) || 0);
    if (expiresAt && Date.now() > expiresAt) {
      clearUserSession();
      return { user: null, accessToken: null };
    }
    const rawUser = localStorage.getItem(USER_KEY);
    if (rawUser) {
      try {
        user = JSON.parse(rawUser) as T;
        accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || null;
      } catch {
        clearUserSession();
        return { user: null, accessToken: null };
      }
    }
  }
  // Check sessionStorage (No Remember Me)
  else {
    const rawUser = sessionStorage.getItem(USER_KEY);
    if (rawUser) {
      try {
        user = JSON.parse(rawUser) as T;
        accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY) || null;
      } catch {
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        return { user: null, accessToken: null };
      }
    }
  }

  return { user, accessToken };
}

// Updated to clear access token
export function clearUserSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

// Updated to include access token
export function updateStoredUser(profile: unknown, accessToken?: string) {
  if (localStorage.getItem(REMEMBER_KEY) === 'true') {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
  }
  if (sessionStorage.getItem(USER_KEY)) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
    if (accessToken) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
  }
}