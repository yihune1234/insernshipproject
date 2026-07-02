/**
 * OfflineQueue — queues API requests when offline, replays when back online.
 * Uses AsyncStorage for persistence and AppState for foreground detection.
 * Each item has a unique ID to prevent duplicate submissions.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

const QUEUE_KEY = 'offline_action_queue';
const MAX_RETRIES = 3;

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timestamp: string;
  retries: number;
  type: string;
}

export interface QueueResult {
  id: string;
  success: boolean;
  error?: string;
}

let isReplaying = false;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
let connectivityInterval: ReturnType<typeof setInterval> | null = null;

async function getQueue(): Promise<QueuedRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedRequest[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Add a request to the offline queue.
 * Generates a unique ID based on type + body to prevent duplicates.
 */
export async function enqueue(
  type: string,
  url: string,
  method: QueuedRequest['method'],
  body?: unknown,
  headers?: Record<string, string>,
): Promise<string> {
  const queue = await getQueue();
  const fingerprint = `${type}:${url}:${JSON.stringify(body ?? {})}`;
  const id = `oq-${Date.now()}-${fingerprint.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0).toString(36).slice(-8)}`;
  if (queue.some(q => q.id === id)) return id;
  const item: QueuedRequest = {
    id, url, method, body, headers, timestamp: new Date().toISOString(), retries: 0, type,
  };
  queue.push(item);
  await saveQueue(queue);
  console.log(`[OfflineQueue] Queued ${method} ${url} (id=${id})`);
  return id;
}

/**
 * Check connectivity by attempting a lightweight fetch.
 */
async function isOnline(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      if (!navigator.onLine) return false;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    await fetch('https://dns.google/generate_204', { method: 'HEAD', signal: ctrl.signal });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Replay all queued requests.
 */
export async function replayQueue(
  getToken: () => Promise<string | null>,
): Promise<QueueResult[]> {
  if (isReplaying) return [];
  const queue = await getQueue();
  if (queue.length === 0) return [];
  const online = await isOnline();
  if (!online) return [];

  isReplaying = true;
  console.log(`[OfflineQueue] Replaying ${queue.length} queued request(s)`);
  const results: QueueResult[] = [];
  const remaining: QueuedRequest[] = [];

  for (const item of queue) {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(item.headers ?? {}),
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(item.url, {
        method: item.method,
        headers,
        body: item.body != null ? JSON.stringify(item.body) : undefined,
      });

      if (res.ok) {
        console.log(`[OfflineQueue] Replayed ${item.method} ${item.url} → ${res.status}`);
        results.push({ id: item.id, success: true });
      } else if (res.status >= 400 && res.status < 500) {
        console.warn(`[OfflineQueue] Client error for ${item.id}: ${res.status} — dropping`);
        results.push({ id: item.id, success: false, error: `HTTP ${res.status}` });
      } else {
        item.retries += 1;
        if (item.retries < MAX_RETRIES) remaining.push(item);
        results.push({ id: item.id, success: false, error: `HTTP ${res.status}` });
      }
    } catch (err) {
      item.retries += 1;
      if (item.retries < MAX_RETRIES) remaining.push(item);
      results.push({ id: item.id, success: false, error: err instanceof Error ? err.message : 'Error' });
    }
  }

  await saveQueue(remaining);
  isReplaying = false;
  console.log(`[OfflineQueue] Replay done. ${remaining.length} item(s) remain.`);
  return results;
}

/**
 * Start listening for app foreground + periodic connectivity check.
 * Call once at app start.
 */
export function startOfflineListener(getToken: () => Promise<string | null>): void {
  if (appStateSubscription) return;

  appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      replayQueue(getToken).catch(() => {});
    }
  });

  connectivityInterval = setInterval(() => {
    replayQueue(getToken).catch(() => {});
  }, 30000);
}

export function stopOfflineListener(): void {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  if (connectivityInterval) {
    clearInterval(connectivityInterval);
    connectivityInterval = null;
  }
}

export async function getQueueLength(): Promise<number> {
  const q = await getQueue();
  return q.length;
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
