import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PinPad, PinDots } from '@/components/ui/PinPad';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import * as LocalAuth from '@/services/auth/localAuth';
import { useColors } from '@/hooks/useColors';
import { getTopPadding } from '@/utils/layout';

type SubView = 'main' | 'changePin' | 'changePin2';

export default function SecurityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { biometricEnabled, biometricAvailable, setupBiometric, disableBiometric } = useAuth();

  const [subView, setSubView] = useState<SubView>('main');
  const [authStatus, setAuthStatus] = useState<LocalAuth.LocalAuthStatus | null>(null);

  const [oldPin, setOldPin] = useState('');
  const [oldPinError, setOldPinError] = useState('');
  const [oldPinVerified, setOldPinVerified] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [bioLoading, setBioLoading] = useState(false);

  const load = useCallback(async () => {
    const s = await LocalAuth.getLocalAuthStatus();
    setAuthStatus(s);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBiometricToggle = async (val: boolean) => {
    setBioLoading(true);
    try {
      if (val) {
        await setupBiometric();
      } else {
        await disableBiometric();
      }
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update biometric setting');
    } finally {
      setBioLoading(false);
    }
  };

  const handleOldPinComplete = async (pin: string) => {
    try {
      const ok = await LocalAuth.verifyPIN(pin);
      if (ok) {
        setOldPin(pin);
        setOldPinVerified(true);
        setOldPinError('');
        setSubView('changePin2');
      } else {
        setOldPinError('Incorrect PIN');
        setOldPin('');
      }
    } catch (e) {
      setOldPinError(e instanceof Error ? e.message : 'Incorrect PIN');
      setOldPin('');
    }
  };

  const handleNewPinComplete = async (pin: string) => {
    if (!oldPinVerified) return;
    try {
      await LocalAuth.changePIN(oldPin, pin);
      setNewPin('');
      setOldPin('');
      setOldPinVerified(false);
      setSubView('main');
      Alert.alert('Success', 'PIN changed successfully');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to change PIN');
    }
  };

  if (subView === 'changePin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: getTopPadding(insets) + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => { setSubView('main'); setOldPin(''); setOldPinError(''); }} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Current PIN</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.pinView}>
          <PinDots value={oldPin} maxLength={6} />
          {oldPinError ? (
            <Text style={[styles.pinError, { color: colors.error, fontFamily: 'Poppins_400Regular' }]}>{oldPinError}</Text>
          ) : (
            <Text style={[styles.pinHint, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>Enter your current PIN</Text>
          )}
          <PinPad value={oldPin} onChange={setOldPin} maxLength={6} onComplete={handleOldPinComplete} />
        </View>
      </View>
    );
  }

  if (subView === 'changePin2') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: getTopPadding(insets) + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => { setSubView('changePin'); setNewPin(''); }} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>New PIN</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.pinView}>
          <PinDots value={newPin} maxLength={6} />
          <Text style={[styles.pinHint, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>Enter your new 6-digit PIN</Text>
          <PinPad value={newPin} onChange={setNewPin} maxLength={6} onComplete={handleNewPinComplete} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
      <View style={[styles.header, { paddingTop: getTopPadding(insets) + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
         <Pressable onPress={() => router.back()} style={styles.back}>
           <Ionicons name="arrow-back" size={24} color={colors.text} />
         </Pressable>
         <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Security</Text>
         <View style={styles.spacer} />
       </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <GroupLabel title="PIN & BIOMETRIC" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Row icon="keypad-outline" label="Change PIN" onPress={() => setSubView('changePin')} colors={colors} showChevron />
          <Sep colors={colors} />

          <View style={styles.toggleRow}>
            <View style={[styles.rowIcon, { backgroundColor: biometricEnabled ? colors.primarySurface : colors.muted }]}>
              <Ionicons name="finger-print" size={18} color={biometricEnabled ? colors.primary : colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: authStatus?.biometricAvailable ? colors.text : colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
                Biometric Login
              </Text>
              {!authStatus?.biometricAvailable && (
                <Text style={[styles.rowSub, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
                  Not available on this device
                </Text>
              )}
            </View>
            {bioLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Switch
                  value={biometricEnabled && (authStatus?.biometricAvailable ?? false)}
                  onValueChange={handleBiometricToggle}
                  disabled={!authStatus?.biometricAvailable}
                  trackColor={{ true: colors.primary }}
                />}
          </View>
        </View>

        <GroupLabel title="AUTO-LOCK" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Row icon="time-outline" label="Lock After" value="1 minute" onPress={() => {}} colors={colors} showChevron />
        </View>

        <GroupLabel title="SESSIONS" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {authStatus && (
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: authStatus.isLocked ? colors.errorSurface : colors.successSurface }]}>
                <Ionicons
                  name={authStatus.isLocked ? 'lock-closed' : 'checkmark-circle'}
                  size={18}
                  color={authStatus.isLocked ? colors.error : colors.success}
                />
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}>
                  {authStatus.isLocked ? 'Account Locked' : 'Account Active'}
                </Text>
                <Text style={[styles.rowSub, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
                  {authStatus.isLocked
                    ? `Locked until ${authStatus.lockedUntil?.toLocaleTimeString()}`
                    : `${authStatus.failedAttempts} failed attempt(s)`}
                </Text>
              </View>
            </View>
          )}
        </View>

        <GroupLabel title="ADVANCED" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Row icon="key-outline" label="View Key Information" onPress={() => {}} colors={colors} showChevron />
          <Sep colors={colors} />
          <View style={[styles.notice, { backgroundColor: colors.infoSurface }]}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.info} />
            <Text style={[styles.noticeText, { color: colors.info, fontFamily: 'Poppins_400Regular' }]}>
              Your private keys never leave your device
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function GroupLabel({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return <Text style={[styles.groupLabel, { color: colors.textSubtle, fontFamily: 'Poppins_600SemiBold' }]}>{title}</Text>;
}

function Row({ icon, label, value, onPress, colors, showChevron }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress: () => void; colors: ReturnType<typeof useColors>; showChevron?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primarySurface }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text, fontFamily: 'Poppins_400Regular', flex: 1 }]}>{label}</Text>
      {value && <Text style={[styles.rowValue, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>{value}</Text>}
      {showChevron && <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />}
    </Pressable>
  );
}

function Sep({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.sep, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { padding: 4 },
  title: { flex: 1, textAlign: 'center', fontSize: 20 },
  spacer: { width: 32 },
  pinView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
  pinError: { fontSize: 13, color: '#FF6B6B' },
  pinHint: { fontSize: 13 },
  content: { padding: 16, gap: 6 },
  groupLabel: { fontSize: 11, letterSpacing: 0.8, marginTop: 12, marginBottom: 4, paddingHorizontal: 4 },
  card: { borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15 },
  rowSub: { fontSize: 12, marginTop: 2 },
  rowValue: { fontSize: 13 },
  sep: { height: 1, marginLeft: 62 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, margin: 12, borderRadius: 8 },
  noticeText: { fontSize: 12, flex: 1 },
});
