import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PinDots, PinPad } from '@/components/ui/PinPad';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function LockScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { unlockWithPin, citizen, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleComplete = async (p: string) => {
    const ok = await unlockWithPin(p);
    if (ok) {
      router.replace('/(tabs)');
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
      setAttempts((a) => a + 1);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'This will log you out. You will need to enter your PIN to access the wallet again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[colors.primary, '#0F3D22']}
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 60 : 20) }]}
    >
      <View style={styles.top}>
        <View style={[styles.logoWrap, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <Text style={[styles.appName, { fontFamily: 'Poppins_600SemiBold' }]}>Debo Wallet</Text>
        <Text style={[styles.welcomeBack, { fontFamily: 'Poppins_400Regular' }]}>Welcome back</Text>
        {citizen && (
          <Text style={[styles.userName, { fontFamily: 'Poppins_700Bold' }]}>{citizen.fullName}</Text>
        )}
      </View>

      <View style={styles.pinSection}>
        <PinDots value={pin} maxLength={6} />
        {error ? (
          <Text style={[styles.error, { fontFamily: 'Poppins_400Regular' }]}>{error}</Text>
        ) : (
          <Text style={[styles.hint, { fontFamily: 'Poppins_400Regular' }]}>Enter your 6-digit PIN</Text>
        )}
        <PinPad value={pin} onChange={setPin} maxLength={6} onComplete={handleComplete} darkMode />
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Text
          onPress={handleSignOut}
          style={[styles.signOut, { fontFamily: 'Poppins_400Regular' }]}
        >
          Sign out
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  top: { alignItems: 'center', gap: 8, marginBottom: 40 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 56, height: 56 },
  appName: { fontSize: 14, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  welcomeBack: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  userName: { fontSize: 24, color: '#FFFFFF' },
  pinSection: { flex: 1, alignItems: 'center', gap: 12 },
  error: { fontSize: 13, color: '#FF6B6B' },
  hint: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  bottom: { alignItems: 'center' },
  signOut: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecorationLine: 'underline' },
});
