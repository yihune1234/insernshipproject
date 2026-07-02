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

export default function PinCreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setPendingPin } = useAuth();
  const [pin, setPin] = useState('');

  const handleComplete = (p: string) => {
    setPendingPin(p);
    setTimeout(() => router.push('/(auth)/pin-confirm'), 200);
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
        <Stepper current={4} total={5} />
      </View>

      <View style={styles.content}>
        <View style={[styles.lockIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Ionicons name="lock-closed" size={36} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { fontFamily: 'Poppins_700Bold' }]}>Create Your PIN</Text>
        <Text style={[styles.subtitle, { fontFamily: 'Poppins_400Regular' }]}>
          Choose a 6-digit PIN to secure your wallet.{'\n'}Never share your PIN with anyone.
        </Text>

        <PinDots value={pin} maxLength={6} />
        <PinPad value={pin} onChange={setPin} maxLength={6} onComplete={handleComplete} darkMode />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255,255,255,0.7)" />
        <Text style={[styles.footerText, { fontFamily: 'Poppins_400Regular' }]}>
          PIN is encrypted and stored locally only
        </Text>
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
    marginBottom: 40,
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
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 16,
  },
  footerText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
});
