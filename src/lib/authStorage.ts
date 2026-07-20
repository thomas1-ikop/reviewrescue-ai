// src/lib/authStorage.ts

const USER_KEY = 'reviewrescue_user';
const REMEMBER_KEY = 'reviewrescue_remember_me';
const EXPIRY_KEY = 'reviewrescue_remember_expires';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Call this right after a successful sign-in.
 * - rememberMe = true  → localStorage (survives browser restarts)
 * - rememberMe = false → sessionStorage (survives refresh, but NOT browser close)
 */
export function persistUserSession(profile: unknown, rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    localStorage.setItem(REMEMBER_KEY, 'true');
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + THIRTY_DAYS_MS));
    // Clean up sessionStorage if it exists to avoid confusion
    sessionStorage.removeItem(USER_KEY);
  } else {
    sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
    // Clean up localStorage in case it was previously set
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }
}

/**
 * Call this on app mount to restore the user session.
 * Checks localStorage first (remember me), then sessionStorage.
 */
export function loadPersistedUserSession<T = any>(): T | null {
  // 1. Check localStorage (Remember Me)
  if (localStorage.getItem(REMEMBER_KEY) === 'true') {
    const expiresAt = Number(localStorage.getItem(EXPIRY_KEY) || 0);
    if (expiresAt && Date.now() < expiresAt) {
      try {
        const raw = localStorage.getItem(USER_KEY);
        if (raw) return JSON.parse(raw) as T;
      } catch {
        // fall through to clear
      }
    }
    // Expired or invalid – clean up
    clearUserSession();
    return null;
  }

  // 2. Check sessionStorage (No remember me, but tab is still open)
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

/**
 * Call this whenever the profile is updated mid-session.
 * Updates the storage that is currently active.
 */
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

/**
 * Call this on sign-out.
 */
export function clearUserSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  sessionStorage.removeItem(USER_KEY);
}