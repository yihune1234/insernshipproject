/**
 * Notification service — polls the holder notifications endpoint every 30 seconds.
 * Stores notifications in AsyncStorage and exposes unread count via a listener pattern.
 *
 * Correct endpoint: GET /api/v1/organizations/holder/notifications/
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { ApiClient } from '../api/client';
import { getApiConfig } from '../api/config';
import { getAccessToken } from '../auth/holderAuth';

const NOTIF_KEY        = 'wallet_notifications';
const POLL_INTERVAL_MS = 30 * 1000;

export interface WalletNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

type Listener = (notifications: WalletNotification[]) => void;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
let listeners: Listener[] = [];
let cachedNotifications: WalletNotification[] = [];

const getClient = () => new ApiClient(getApiConfig());

export async function fetchNotifications(): Promise<WalletNotification[]> {
  try {
    const token = await getAccessToken();
    if (!token) return getCachedNotifications();

    const client = getClient();
    const res = await client.get<unknown>('/notifications/', token);
    let notifications: WalletNotification[] = [];

    if (Array.isArray(res)) {
      notifications = res as WalletNotification[];
    } else if (res && typeof res === 'object' && 'results' in (res as object)) {
      notifications = (res as Record<string, unknown>).results as WalletNotification[];
    }

    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
    cachedNotifications = notifications;
    listeners.forEach(l => l(notifications));
    return notifications;
  } catch {
    return getCachedNotifications();
  }
}

export async function getCachedNotifications(): Promise<WalletNotification[]> {
  if (cachedNotifications.length > 0) return cachedNotifications;
  try {
    const raw = await AsyncStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  const notifs = await getCachedNotifications();
  return notifs.filter(n => !n.is_read).length;
}

export async function markAsRead(id: string): Promise<void> {
  try {
    const token = await getAccessToken();
    if (!token) return;
    const client = getClient();
    await client.post('/notifications/mark-read/', { ids: [id] }, token);
  } catch {}

  const notifs = await getCachedNotifications();
  const updated = notifs.map(n => n.id === id ? { ...n, is_read: true } : n);
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  cachedNotifications = updated;
  listeners.forEach(l => l(updated));
}

export async function markAllRead(): Promise<void> {
  try {
    const token = await getAccessToken();
    if (!token) return;
    const client = getClient();
    await client.post('/notifications/mark-all-read/', {}, token);
  } catch {}

  const notifs = await getCachedNotifications();
  const updated = notifs.map(n => ({ ...n, is_read: true }));
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  cachedNotifications = updated;
  listeners.forEach(l => l(updated));
}

export async function deleteNotification(id: string): Promise<void> {
  try {
    const token = await getAccessToken();
    if (!token) return;
    const client = getClient();
    // No backend delete endpoint; update is local-cache-only
    void id;
  } catch {}

  const notifs = await getCachedNotifications();
  const updated = notifs.filter(n => n.id !== id);
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  cachedNotifications = updated;
  listeners.forEach(l => l(updated));
}

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function startNotificationPolling(): void {
  if (pollTimer) return;

  fetchNotifications().catch(() => {});

  pollTimer = setInterval(() => {
    fetchNotifications().catch(() => {});
  }, POLL_INTERVAL_MS);

  appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      fetchNotifications().catch(() => {});
    }
  });
}

export function stopNotificationPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}
