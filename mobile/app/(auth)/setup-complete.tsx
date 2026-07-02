import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function SetupCompleteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { citizen } = useAuth();

  const features = [
    { icon: 'document-text' as const, text: '8 credentials loaded in your wallet' },
    { icon: 'shield-checkmark' as const, text: 'Wallet secured with 6-digit PIN' },
    { icon: 'wifi' as const, text: 'Offline access enabled' },
    { icon: 'notifications' as const, text: 'Notifications configured' },
  ];

  return (
    <LinearGradient
      colors={[colors.primary, '#0F3D22']}
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 60 : 20) }]}
    >
      <Animated.View entering={ZoomIn.delay(200).duration(600)} style={styles.checkCircle}>
        <View style={[styles.checkBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Ionicons name="checkmark" size={60} color="#FFFFFF" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.textWrap}>
        <Text style={[styles.title, { fontFamily: 'Poppins_700Bold' }]}>Wallet Ready!</Text>
        <Text style={[styles.name, { fontFamily: 'Poppins_600SemiBold' }]}>
          Welcome, {citizen?.firstName}
        </Text>
        <Text style={[styles.subtitle, { fontFamily: 'Poppins_400Regular' }]}>
          Your Debo Wallet is set up and ready to use.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.features}>
        {features.map((f, i) => (
          <Animated.View
            key={f.text}
            entering={FadeInDown.delay(800 + i * 100).duration(400)}
            style={styles.featureRow}
          >
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Ionicons name={f.icon} size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.featureText, { fontFamily: 'Poppins_400Regular' }]}>{f.text}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(1200).duration(500)}
        style={[styles.bottom, { paddingBottom: insets.bottom + 32 }]}
      >
        <Button label="Open My Wallet" onPress={() => router.replace('/(tabs)')} variant="primary" />
        <View style={[styles.goldBar, { backgroundColor: colors.gold }]} />
        <Text style={[styles.authority, { fontFamily: 'Poppins_400Regular' }]}>
          Debo Wallet — National Digital Credential Wallet{'\n'}Issued by NDICA, Ethiopia
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, alignItems: 'center' },
  checkCircle: { marginBottom: 24, marginTop: 20 },
  checkBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  textWrap: { alignItems: 'center', gap: 6, marginBottom: 32 },
  title: { fontSize: 34, color: '#FFFFFF' },
  name: { fontSize: 20, color: 'rgba(255,255,255,0.9)' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  features: { gap: 14, width: '100%', marginBottom: 40 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  bottom: { width: '100%', gap: 16, alignItems: 'center' },
  goldBar: { height: 3, width: 60, borderRadius: 2 },
  authority: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 18 },
});
