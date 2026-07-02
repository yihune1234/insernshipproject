import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Stepper } from '@/components/ui/Stepper';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function NationalIdScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { verifyNationalId } = useAuth();
  const [nationalId, setNationalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!nationalId.trim()) {
      setError('Please enter your National ID number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyNationalId(nationalId.trim());
      router.push('/(auth)/otp');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 40 : 16), borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Stepper current={1} total={5} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySurface }]}>
          <Ionicons name="card-outline" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
          Verify Your Identity
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
          Enter your Ethiopian National ID number to begin wallet registration.
        </Text>

        <View style={styles.form}>
          <Input
            label="National ID Number"
            placeholder="e.g. ET123456789"
            value={nationalId}
            onChangeText={setNationalId}
            autoCapitalize="characters"
            leftIcon="card-outline"
            error={error}
            hint="Try ET123456789 or ET987654321 for demo"
          />
          <Button label="Verify Identity" onPress={handleVerify} loading={loading} />
        </View>

        <View style={[styles.notice, { backgroundColor: colors.infoSurface, borderRadius: colors.radius }]}>
          <Ionicons name="information-circle" size={18} color={colors.info} />
          <Text style={[styles.noticeText, { color: colors.info, fontFamily: 'Poppins_400Regular' }]}>
            Your National ID is verified against the NIDA registry. Data is encrypted and never shared without your consent.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0,
  },
  back: { padding: 4 },
  step: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  stepText: { fontSize: 12 },
  content: { padding: 28, gap: 20 },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: { fontSize: 26, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  form: { gap: 16 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
  },
  noticeText: { fontSize: 12, flex: 1, lineHeight: 18 },
});
