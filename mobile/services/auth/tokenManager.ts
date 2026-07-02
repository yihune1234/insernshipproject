/**
 * tokenManager.ts
 * Proactively refreshes the JWT access token before it expires.
 * — Decodes JWT locally (no server round-trip) to check expiry
 * — Schedules a timer to refresh 5 min before expiry
 * — On network reconnect, immediately checks and refreshes if within window
 * — Offline tokens (prefixed "offline-") are skipped gracefully
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authApi } from './authApi';

const REFRESH_AHEAD_MS = 5 * 60 * 1000;   // refresh 5 min before expiry
const OFFLINE_PREFIX   = 'offline-';
const KEY_ACCESS       = 'access_token';
const KEY_REFRESH      = 'refresh_token';
const KEY_ACCESS_BAK   = 'backup_access_token';
const KEY_REFRESH_BAK  = 'backup_refresh_token';

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let isRefreshing = false;

// ── JWT helpers (no verification — local decode only) ─────────────────────────

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded  = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getTokenExpiryMs(token: string): number | null {
  const p = decodeJwtPayload(token);
  return p && typeof p.exp === 'number' ? p.exp * 1000 : null;
}

export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiryMs(token);
  return exp == null || Date.now() >= exp;
}

export function msUntilExpiry(token: string): number {
  const exp = getTokenExpiryMs(token);
  return exp == null ? -1 : exp - Date.now();
}

// ── Storage helpers ───────────────────────────────────────────────────────────

async function readAccessToken(): Promise<string | null> {
  try {
    return (
      (await SecureStore.getItemAsync(KEY_ACCESS)) ??
      (await AsyncStorage.getItem(KEY_ACCESS_BAK))
    );
  } catch {
    return null;
  }
}

async function readRefreshToken(): Promise<string | null> {
  try {
    return (
      (await SecureStore.getItemAsync(KEY_REFRESH)) ??
      (await AsyncStorage.getItem(KEY_REFRESH_BAK))
    );
  } catch {
    return null;
  }
}

async function persistTokens(access: string, refresh?: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEY_ACCESS, access).catch(() => {}),
    AsyncStorage.setItem(KEY_ACCESS_BAK, access),
  ]);
  if (refresh) {
    await Promise.all([
      SecureStore.setItemAsync(KEY_REFRESH, refresh).catch(() => {}),
      AsyncStorage.setItem(KEY_REFRESH_BAK, refresh),
    ]);
  }
}

// ── Core refresh ──────────────────────────────────────────────────────────────

async function performRefresh(): Promise<boolean> {
  if (isRefreshing) return false;
  isRefreshing = true;
  try {
    const refreshToken = await readRefreshToken();
    if (!refreshToken) { isRefreshing = false; return false; }

    // Offline tokens — never attempt server refresh
    if (refreshToken.startsWith(OFFLINE_PREFIX)) {
      isRefreshing = false;
      return false;
    }

    const response = await authApi.refreshToken(refreshToken);
    if (!response?.access) { isRefreshing = false; return false; }

    await persistTokens(response.access, response.refresh);
    scheduleRefresh(response.access);
    isRefreshing = false;
    return true;
  } catch {
    // Network unavailable — silent fail; app continues with cached data
    isRefreshing = false;
    return false;
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

function scheduleRefresh(token: string): void {
  if (refreshTimer) clearTimeout(refreshTimer);
  const remaining = msUntilExpiry(token);
  if (remaining <= 0) {
    performRefresh().catch(() => {});
    return;
  }
  const delay = Math.max(0, remaining - REFRESH_AHEAD_MS);
  refreshTimer = setTimeout(() => { performRefresh().catch(() => {}); }, delay);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Start the manager. Call once after successful local authentication.
 * Reads the stored access token, decides whether to refresh now or schedule.
 */
export async function startTokenManager(): Promise<void> {
  const token = await readAccessToken();
  if (!token || token.startsWith(OFFLINE_PREFIX)) return;

  if (isTokenExpired(token)) {
    await performRefresh();
  } else {
    scheduleRefresh(token);
  }
}

/**
 * Stop the manager — call on logout or app unmount.
 */
export function stopTokenManager(): void {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
  isRefreshing = false;
}

/**
 * Called when network connectivity is restored.
 * Immediately refreshes if the token is stale or about to expire,
 * then reschedules the timer.
 */
export async function onNetworkReconnect(): Promise<void> {
  const token = await readAccessToken();
  if (!token || token.startsWith(OFFLINE_PREFIX)) return;

  const remaining = msUntilExpiry(token);
  if (remaining <= REFRESH_AHEAD_MS) {
    await performRefresh();
  } else {
    scheduleRefresh(token); // ensure timer is set after reconnect
  }
}

/**
 * Snapshot of the current token state — useful for displaying
 * connection/session status in the UI.
 */
export async function getTokenStatus(): Promise<{
  hasToken: boolean;
  isExpired: boolean;
  isOfflineToken: boolean;
  expiresInMs: number | null;
  expiresAt: Date | null;
}> {
  const token = await readAccessToken();
  if (!token) {
    return { hasToken: false, isExpired: true, isOfflineToken: false, expiresInMs: null, expiresAt: null };
  }
  if (token.startsWith(OFFLINE_PREFIX)) {
    return { hasToken: true, isExpired: false, isOfflineToken: true, expiresInMs: null, expiresAt: null };
  }
  const expMs = getTokenExpiryMs(token);
  return {
    hasToken: true,
    isExpired: isTokenExpired(token),
    isOfflineToken: false,
    expiresInMs: expMs != null ? expMs - Date.now() : null,
    expiresAt: expMs != null ? new Date(expMs) : null,
  };
}
