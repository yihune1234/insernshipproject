/**
 * useNetworkStatus.ts
 * Detects network connectivity without requiring @react-native-community/netinfo.
 * Strategy:
 *  1. Check navigator.onLine (fast, no I/O)
 *  2. Confirm with a lightweight HTTP probe to dns.google
 *  3. Poll every 15 s + re-check whenever the app comes to the foreground
 *  4. Fire onReconnect() (debounced) on any offline → online transition
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const PING_URL        = 'https://dns.google/generate_204';
const PING_TIMEOUT_MS = 4000;
const POLL_INTERVAL_MS = 15000;
const DEBOUNCE_MS     = 800;

async function checkConnectivity(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
      return false;
    }
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PING_TIMEOUT_MS);
    const res   = await fetch(PING_URL, { method: 'HEAD', signal: ctrl.signal });
    clearTimeout(timer);
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

export interface NetworkStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastCheckedAt: Date | null;
  checkNow: () => Promise<void>;
}

export function useNetworkStatus(onReconnect?: () => void): NetworkStatus {
  const [isOnline,      setIsOnline]      = useState(true);  // optimistic
  const [isChecking,    setIsChecking]    = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const wasOnlineRef     = useRef(true);
  const debounceRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const onReconnectRef   = useRef(onReconnect);
  const isMountedRef     = useRef(true);

  useEffect(() => { onReconnectRef.current = onReconnect; }, [onReconnect]);

  const check = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsChecking(true);
    const online = await checkConnectivity();
    if (!isMountedRef.current) return;

    setIsOnline(online);
    setLastCheckedAt(new Date());
    setIsChecking(false);

    // offline → online transition
    if (online && !wasOnlineRef.current) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onReconnectRef.current?.();
      }, DEBOUNCE_MS);
    }
    wasOnlineRef.current = online;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    check();

    pollRef.current = setInterval(check, POLL_INTERVAL_MS);

    const appSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });

    return () => {
      isMountedRef.current = false;
      if (pollRef.current)   clearInterval(pollRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      appSub.remove();
    };
  }, [check]);

  return { isOnline, isChecking, lastCheckedAt, checkNow: check };
}
