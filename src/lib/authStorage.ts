// src/lib/authStorage.ts

const USER_KEY = 'reviewrescue_user';
const REMEMBER_KEY = 'reviewrescue_remember_me';
const EXPIRY_KEY = 'reviewrescue_remember_expires';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function persistUserSession(profile: unknown, rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    localStorage.setItem(REMEMBER_KEY, 'true');
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + THIRTY_DAYS_MS));
    sessionStorage.removeItem(USER_KEY);
  } else {
    sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }
}

export function loadPersistedUserSession<T = any>(): T | null {
  // ─── 1. Check if "Remember Me" is active ────────────────────────
  if (localStorage.getItem(REMEMBER_KEY) === 'true') {
    const expiresAt = Number(localStorage.getItem(EXPIRY_KEY) || 0);
    // ✅ If expired, clear and return null
    if (expiresAt && Date.now() > expiresAt) {
      clearUserSession();
      return null;
    }
    // ✅ Otherwise, load the user
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        clearUserSession();
        return null;
      }
    }
  }

  // ─── 2. Check sessionStorage (no remember me) ──────────────────
  const sessionRaw = sessionStorage.getItem(USER_KEY);
  if (sessionRaw) {
    try {
      return JSON.parse(sessionRaw) as T;
    } catch {
      sessionStorage.removeItem(USER_KEY);
      return null;
    }
  }

  return null;
}

export function updateStoredUser(profile: unknown) {
  // Update localStorage if Remember Me is active
  if (localStorage.getItem(REMEMBER_KEY) === 'true') {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }
  // Update sessionStorage if it exists
  if (sessionStorage.getItem(USER_KEY)) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
  }
}

export function clearUserSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  sessionStorage.removeItem(USER_KEY);
}