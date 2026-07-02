/**
 * credentialSync — pulls credential updates from the backend on app foreground.
 * Runs silently without blocking the UI.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { credentialApi } from '../credentials/credentialApi';

const LAST_SYNC_KEY = 'credential_sync_last';
const MIN_SYNC_INTERVAL_MS = 30 * 1000;

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
let isSyncing = false;

/**
 * Pull all credentials from the server and update the local AsyncStorage cache.
 * Merges changed statuses and new credentials into the existing cache.
 */
export async function syncCredentials(): Promise<{ updated: number; added: number }> {
  if (isSyncing) return { updated: 0, added: 0 };

  const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
  if (lastSync) {
    const elapsed = Date.now() - parseInt(lastSync, 10);
    if (elapsed < MIN_SYNC_INTERVAL_MS) return { updated: 0, added: 0 };
  }

  isSyncing = true;
  let updated = 0;
  let added = 0;

  try {
    const { credentials: fresh } = await credentialApi.listCredentials();
    if (!Array.isArray(fresh) || fresh.length === 0) {
      isSyncing = false;
      return { updated: 0, added: 0 };
    }

    const cachedRaw = await AsyncStorage.getItem('cached_credentials');
    const cached: Record<string, unknown>[] = cachedRaw ? JSON.parse(cachedRaw) : [];

    const cachedMap = new Map<string, Record<string, unknown>>();
    for (const c of cached) {
      const id = String((c as Record<string, unknown>).credential_uuid ?? (c as Record<string, unknown>).id ?? '');
      if (id) cachedMap.set(id, c as Record<string, unknown>);
    }

    for (const freshCred of fresh as Record<string, unknown>[]) {
      const id = String(freshCred.credential_uuid ?? freshCred.id ?? '');
      if (!id) continue;
      if (cachedMap.has(id)) {
        const existing = cachedMap.get(id)!;
        if (existing.status !== freshCred.status) {
          cachedMap.set(id, { ...existing, ...freshCred });
          updated++;
        }
      } else {
        cachedMap.set(id, freshCred);
        added++;
      }
    }

    const merged = Array.from(cachedMap.values());
    await AsyncStorage.setItem('cached_credentials', JSON.stringify(merged));
    await AsyncStorage.setItem(LAST_SYNC_KEY, String(Date.now()));

    if (updated + added > 0) {
      console.log(`[CredentialSync] updated=${updated} added=${added}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (!msg.includes('Connection failed') && !msg.includes('unreachable')) {
      console.warn('[CredentialSync] sync failed:', err);
    }
  } finally {
    isSyncing = false;
  }

  return { updated, added };
}

/**
 * Start automatic sync on every app foreground event.
 * Call once at app start.
 */
export function startCredentialSync(): void {
  if (appStateSubscription) return;
  appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      syncCredentials().catch(() => {});
    }
  });
}

export function stopCredentialSync(): void {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}
