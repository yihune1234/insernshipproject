import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { Input } from '@/components/ui/Input';
import { Stepper } from '@/components/ui/Stepper';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function OtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    verifyOtp, pendingCitizen, pendingNationalId, pendingAccountExists,
    pendingOtpForTesting,
  } = useAuth() as ReturnType<typeof useAuth> & { pendingOtpForTesting?: string };
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maskedPhone = pendingCitizen?.maskedPhone ?? '****';

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Enter all 6 digits'); return; }
    if (pendingAccountExists && !phone.trim()) {
      setError('Please enter the phone number associated with this account');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyOtp(otp, pendingAccountExists ? phone.trim() : undefined);
      router.push('/(auth)/identity-confirm');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (val: string) => {
    if (pendingAccountExists && !phone.trim()) return;
    setError('');
    setLoading(true);
    try {
      await verifyOtp(val, pendingAccountExists ? phone.trim() : undefined);
      router.push('/(auth)/identity-confirm');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 40 : 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Stepper current={2} total={5} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySurface }]}>
          <Ionicons name="phone-portrait-outline" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
          Verify Phone Number
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
          {pendingAccountExists
            ? 'This National ID is already registered. To recover your wallet, please verify your identity.'
            : `Enter the 6-digit code sent to `}
          {!pendingAccountExists && (
            <Text style={{ color: colors.primary, fontFamily: 'Poppins_600SemiBold' }}>
              {maskedPhone}
            </Text>
          )}
        </Text>

        {/* Test mode banner — shown when backend returns otp_for_testing */}
        {!!pendingOtpForTesting && (
          <View style={[styles.testBanner, { backgroundColor: '#FFF3CD', borderColor: '#FFCA28' }]}>
            <Ionicons name="flask-outline" size={16} color="#856404" />
            <View style={styles.testBannerText}>
              <Text style={[styles.testBannerTitle, { fontFamily: 'Poppins_600SemiBold' }]}>
                Test Mode — Simulated OTP
              </Text>
              <Text style={[styles.testBannerOtp, { fontFamily: 'Poppins_700Bold' }]}>
                {pendingOtpForTesting}
              </Text>
            </View>
          </View>
        )}

        {pendingAccountExists && (
          <View style={{ width: '100%', marginTop: 8 }}>
            <Input
              label="Associated Phone Number"
              placeholder="e.g. +251912345678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon="call-outline"
              error={error && !phone.trim() ? error : undefined}
            />
          </View>
        )}

        <View style={styles.otpWrap}>
          <OtpInput value={otp} onChange={setOtp} onComplete={handleComplete} length={6} />
          {error && (!pendingAccountExists || phone.trim()) ? (
            <Text style={[styles.error, { color: colors.error, fontFamily: 'Poppins_400Regular' }]}>
              {error}
            </Text>
          ) : !pendingOtpForTesting ? (
            <Text style={[styles.hint, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
              Demo OTP: 123456
            </Text>
          ) : null}
        </View>

        <Button
          label={pendingAccountExists ? 'Verify & Recover' : 'Verify OTP'}
          onPress={handleVerify}
          loading={loading}
          disabled={otp.length < 6 || (pendingAccountExists && !phone.trim())}
        />

        <Pressable style={styles.resend}>
          <Text style={[styles.resendText, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
            Resend Code
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  back: { padding: 4 },
  step: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  stepText: { fontSize: 12 },
  content: { flex: 1, padding: 28, alignItems: 'center', gap: 20 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  testBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderRadius: 10,
    alignSelf: 'stretch',
  },
  testBannerText: { gap: 2 },
  testBannerTitle: { fontSize: 12, color: '#856404' },
  testBannerOtp: { fontSize: 22, color: '#533F03', letterSpacing: 4 },
  otpWrap: { gap: 12, alignItems: 'center', width: '100%' },
  error: { fontSize: 13 },
  hint: { fontSize: 12 },
  resend: { padding: 8 },
  resendText: { fontSize: 14 },
});
