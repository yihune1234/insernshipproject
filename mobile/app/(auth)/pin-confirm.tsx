import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PinDots, PinPad } from '@/components/ui/PinPad';
import { Stepper } from '@/components/ui/Stepper';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function PinConfirmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { confirmPinAndSetup } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async (p: string) => {
    setError('');
    setLoading(true);
    try {
      const ok = await confirmPinAndSetup(p);
      setLoading(false);
      if (ok) {
        router.replace('/(auth)/setup-complete');
      } else {
        setError('PINs do not match. Try again.');
        setPin('');
      }
    } catch (e: unknown) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'Registration failed. Try again.');
      setPin('');
    }
  };

  return (
    <LinearGradient
      colors={[colors.primary, '#0F3D22']}
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 40 : 16) }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Stepper current={5} total={5} />
      </View>

      <View style={styles.content}>
        <View style={[styles.lockIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Ionicons name="lock-closed" size={36} color={error ? '#FFD700' : '#FFFFFF'} />
        </View>
        <Text style={[styles.title, { fontFamily: 'Poppins_700Bold' }]}>Confirm Your PIN</Text>
        <Text style={[styles.subtitle, { fontFamily: 'Poppins_400Regular' }]}>
          Re-enter your PIN to confirm
        </Text>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: 'rgba(192,57,43,0.3)' }]}>
            <Ionicons name="close-circle" size={16} color="#FF6B6B" />
            <Text style={[styles.errorText, { fontFamily: 'Poppins_400Regular' }]}>{error}</Text>
          </View>
        ) : (
          <View style={styles.errorPlaceholder} />
        )}

        <PinDots value={pin} maxLength={6} />
        <PinPad value={pin} onChange={setPin} maxLength={6} onComplete={handleComplete} darkMode />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {loading && (
          <Text style={[styles.footerText, { fontFamily: 'Poppins_400Regular' }]}>Setting up wallet…</Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  back: { padding: 4 },
  step: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  stepText: { fontSize: 12, color: '#FFFFFF' },
  content: { flex: 1, alignItems: 'center' },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  errorText: { color: '#FF6B6B', fontSize: 13 },
  errorPlaceholder: { height: 42, marginTop: 12 },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
});
