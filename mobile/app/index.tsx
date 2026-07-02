import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function Index() {
  const { isLoading, isOnboarded, isAuthenticated } = useAuth();
  const colors = useColors();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  if (!isOnboarded) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/lock" />;
  }

  return <Redirect href="/(tabs)" />;
}
