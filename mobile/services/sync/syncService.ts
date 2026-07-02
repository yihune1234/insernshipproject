import AsyncStorage from '@react-native-async-storage/async-storage';
import { credentialApi } from '../credentials/credentialApi';

const KEYS = {
  LAST_SYNC: 'last_sync_timestamp',
  OFFLINE_QUEUE: 'offline_queue',
};

export interface OfflineAction { id: string; type: string; data: unknown; timestamp: string; }

export async function saveSyncToken(token: string): Promise<void> {
  await AsyncStorage.setItem('sync_token', token);
}

export async function getSyncToken(): Promise<string | null> {
  return AsyncStorage.getItem('sync_token');
}

export async function syncData(): Promise<void> {
  try {
    await credentialApi.syncCredentials();
    await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (!msg.includes('Connection failed') && !msg.includes('unreachable')) {
      console.warn('[Sync] sync failed:', e);
    }
  }
}

export async function addOfflineAction(type: string, data: unknown): Promise<void> {
  const action: OfflineAction = {
    id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type, data, timestamp: new Date().toISOString(),
  };
  const queue = await getOfflineActions();
  queue.push(action);
  await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
}

export async function getOfflineActions(): Promise<OfflineAction[]> {
  const json = await AsyncStorage.getItem(KEYS.OFFLINE_QUEUE);
  return json ? JSON.parse(json) : [];
}

export async function clearSyncData(): Promise<void> {
  await AsyncStorage.multiRemove(['sync_token', KEYS.LAST_SYNC, KEYS.OFFLINE_QUEUE]);
}
