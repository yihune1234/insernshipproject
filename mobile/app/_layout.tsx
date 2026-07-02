import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { CredentialsProvider } from '@/contexts/CredentialsContext';
import { ActivitiesProvider } from '@/contexts/ActivitiesContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { startNotificationPolling, stopNotificationPolling } from '@/services/notifications/notificationService';
import { startCredentialSync, stopCredentialSync } from '@/services/sync/credentialSync';
import { startOfflineListener, stopOfflineListener } from '@/services/offline/OfflineQueue';
import { getAccessToken } from '@/services/auth/holderAuth';
import { configureForegroundNotifications } from '@/services/notifications/pushTokenService';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="credential/[id]" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="share" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="qr-display" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="verification-result" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="request-credential" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="settings/profile" options={{ headerShown: false }} />
      <Stack.Screen name="settings/security" options={{ headerShown: false }} />
      <Stack.Screen name="settings/language" options={{ headerShown: false }} />
      <Stack.Screen name="settings/appearance" options={{ headerShown: false }} />
      <Stack.Screen name="settings/wallet-management" options={{ headerShown: false }} />
      <Stack.Screen name="settings/about" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false, presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    configureForegroundNotifications().catch(() => {});
    startNotificationPolling();
    startCredentialSync();
    startOfflineListener(getAccessToken);
    return () => {
      stopNotificationPolling();
      stopCredentialSync();
      stopOfflineListener();
    };
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      {/* Global status bar configuration */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={false}
      />
      <ErrorBoundary>
        <AuthProvider>
          <PreferencesProvider>
            <NetworkProvider>
              <CredentialsProvider>
                <ActivitiesProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <KeyboardProvider>
                      <RootLayoutNav />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                </ActivitiesProvider>
              </CredentialsProvider>
            </NetworkProvider>
          </PreferencesProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}