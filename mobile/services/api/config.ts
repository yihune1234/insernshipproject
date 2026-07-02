import { Platform } from 'react-native';

export interface ApiConfig {
  baseUrl: string;
  errorLogUrl?: string;
}

function resolveBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (!configuredUrl || !configuredUrl.trim()) {
    throw new Error(
      `EXPO_PUBLIC_API_BASE_URL is not set.\n` +
      `Add it to mobile/.env.local:\n` +
      `EXPO_PUBLIC_API_BASE_URL=http://<server-ip>:8000/api\n` +
      `(Platform: ${Platform.OS})`
    );
  }

  const url = configuredUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(`Invalid API URL: "${url}". Must start with http:// or https://`);
  }

  return url;
}

export function getApiConfig(): ApiConfig {
  return {
    baseUrl: resolveBaseUrl(),
    errorLogUrl: process.env.EXPO_PUBLIC_ERROR_LOG_URL?.trim() || undefined,
  };
}
