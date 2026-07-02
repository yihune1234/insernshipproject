import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const features = [
    { icon: 'shield-checkmark', label: 'Secure Digital Identity' },
    { icon: 'document-text', label: '8+ Credential Types' },
    { icon: 'wifi', label: 'Offline First' },
    { icon: 'globe', label: 'Amharic, Oromo & More' },
  ];

  return (
    <LinearGradient
      colors={[colors.primary, '#0F3D22']}
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 40 : 0) }]}
    >
      <View style={styles.top}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.appName, { fontFamily: 'Poppins_700Bold' }]}>Debo Wallet</Text>
        <Text style={[styles.tagline, { fontFamily: 'Poppins_400Regular' }]}>
          National Digital Credential Wallet
        </Text>
        <Text style={[styles.authority, { fontFamily: 'Poppins_400Regular' }]}>
          Powered by NDICA — Federal Democratic Republic of Ethiopia
        </Text>
      </View>

      <View style={styles.features}>
        {features.map((f) => (
          <View key={f.label} style={styles.feature}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Ionicons name={f.icon as keyof typeof Ionicons.glyphMap} size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.featureLabel, { fontFamily: 'Poppins_500Medium' }]}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 32 }]}>
        <Button
          label="Get Started"
          onPress={() => router.push('/(auth)/national-id')}
          variant="primary"
        />
        <Text style={[styles.disclaimer, { fontFamily: 'Poppins_400Regular' }]}>
          By continuing, you agree to the National Digital Identity Framework
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28 },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  logo: { width: 80, height: 80 },
  appName: { fontSize: 32, color: '#FFFFFF', letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  authority: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
  features: { gap: 14, marginBottom: 40 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { color: '#FFFFFF', fontSize: 14 },
  bottom: { gap: 16 },
  disclaimer: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
