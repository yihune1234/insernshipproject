/**
 * Expo Push Token Service
 *
 * Registers the device's Expo push token with the backend so the server
 * can send push notifications (e.g. when a credential request is approved or rejected).
 *
 * Requires: expo-notifications (install with: npx expo install expo-notifications)
 * Falls back silently if the package is unavailable or permissions denied.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiClient } from '../api/client';
import { getApiConfig } from '../api/config';
import { getAccessToken } from '../auth/holderAuth';

const TOKEN_CACHE_KEY = 'expo_push_token_registered';

async function getExpoPushToken(): Promise<string | null> {
  try {
    const Notifications = await import('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return tokenResponse.data;
  } catch {
    return null;
  }
}

/**
 * Register the device's push token with the backend.
 * Safe to call on every login — skips if already registered with the same token.
 */
export async function registerPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const pushToken = await getExpoPushToken();
    if (!pushToken) return;

    const cached = await AsyncStorage.getItem(TOKEN_CACHE_KEY);
    if (cached === pushToken) return;

    const accessToken = await getAccessToken();
    if (!accessToken) return;

    const client = new ApiClient(getApiConfig());
    await client.post('/api/auth/push-token/', { push_token: pushToken }, accessToken);

    await AsyncStorage.setItem(TOKEN_CACHE_KEY, pushToken);
  } catch {
    /* non-blocking — push is a best-effort feature */
  }
}

/**
 * Remove the push token from the backend on logout.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(TOKEN_CACHE_KEY);
    if (!cached) return;

    const accessToken = await getAccessToken();
    if (!accessToken) return;

    const client = new ApiClient(getApiConfig());
    await client.delete('/api/auth/push-token/', accessToken);

    await AsyncStorage.removeItem(TOKEN_CACHE_KEY);
  } catch {
    /* non-blocking */
  }
}

/**
 * Configure how notifications appear when the app is foregrounded.
 * Call this once at app startup.
 */
export async function configureForegroundNotifications(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    /* expo-notifications not installed — skip */
  }
}
