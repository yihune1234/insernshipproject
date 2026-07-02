import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { sharingApi } from '@/services/sharing/sharingApi';
import { useCredentials } from '@/contexts/CredentialsContext';
import { useColors } from '@/hooks/useColors';
import { getTopPadding } from '@/utils/layout';

export default function QrDisplayScreen() {
  const { credentialId } = useLocalSearchParams<{ credentialId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { credentials } = useCredentials();
  const credential = credentials.find((c) => c.id === credentialId) ?? credentials[0];

  const [qrToken, setQrToken] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [expiresAt, setExpiresAt] = useState<number>(Date.now() + 600000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadQr = async () => {
    if (!credential) return;
    const res = await sharingApi.shareCredential(credential.id);
    if (res.success && res.data) {
      setQrToken(res.data.shareUrl || res.data.qrToken);
      const secs = Math.floor((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000);
      setSecondsLeft(secs > 0 ? secs : 600);
    } else {
      // Fallback: use verification URL as QR content
      setQrToken(credential.verificationUrl);
    }
  };

  useEffect(() => {
    loadQr();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    timerRef.current = setInterval(() => {
      const s = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s === 0 && timerRef.current) clearInterval(timerRef.current);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [expiresAt]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const expired = secondsLeft === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: getTopPadding(insets) + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
          Scan to Verify
        </Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        {/* Credential chip */}
        <View style={[styles.credChip, { backgroundColor: credential.color + '18', borderColor: credential.color + '40', borderRadius: colors.radius }]}>
          <View style={[styles.credChipDot, { backgroundColor: credential.color }]} />
          <Text style={[styles.credChipText, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
            {credential.title} · {credential.issuer.name}
          </Text>
        </View>

        {/* QR Code */}
        <View style={[styles.qrWrapper, { borderColor: colors.border, borderRadius: colors.radius + 8, backgroundColor: '#FFFFFF' }]}>
          {expired ? (
            <View style={styles.expiredOverlay}>
              <Ionicons name="time-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.expiredText, { color: colors.textMuted, fontFamily: 'Poppins_600SemiBold' }]}>
                QR Expired
              </Text>
              <Pressable onPress={loadQr} style={[styles.refreshBtn, { backgroundColor: colors.primarySurface }]}>
                <Text style={[styles.refreshText, { color: colors.primary, fontFamily: 'Poppins_600SemiBold' }]}>
                  Refresh QR
                </Text>
              </Pressable>
            </View>
          ) : qrToken ? (
            <QRCode
              value={credential.verificationUrl + '?token=' + qrToken}
              size={240}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
          ) : (
            <View style={styles.qrPlaceholder} />
          )}
        </View>

        {/* Timer */}
        {!expired && (
          <View style={styles.timerRow}>
            <Ionicons name="time-outline" size={16} color={secondsLeft < 60 ? colors.warning : colors.textMuted} />
            <Text
              style={[
                styles.timerText,
                {
                  color: secondsLeft < 60 ? colors.warning : colors.textMuted,
                  fontFamily: 'Poppins_600SemiBold',
                },
              ]}
            >
              Expires in: {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </Text>
          </View>
        )}

        {/* Verification URL */}
        <View style={[styles.urlRow, { backgroundColor: colors.backgroundAlt, borderRadius: colors.radius }]}>
          <Text style={[styles.urlLabel, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
            Verification URL:
          </Text>
          <Text style={[styles.urlValue, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]} numberOfLines={1}>
            {qrToken || `${credential.id}`}
          </Text>
          <Pressable onPress={() => Alert.alert('Copied', 'Verification URL copied to clipboard')}>
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <Button label="Share Link Instead" onPress={() => router.push({ pathname: '/share', params: { credentialId: credential.id } })} variant="outline" />
        <Button label="Done" onPress={() => router.back()} variant="ghost" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  back: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18 },
  spacer: { width: 32 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, gap: 20 },
  credChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, alignSelf: 'stretch' },
  credChipDot: { width: 8, height: 8, borderRadius: 4 },
  credChipText: { fontSize: 14 },
  qrWrapper: { padding: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  expiredOverlay: { alignItems: 'center', gap: 12, padding: 20 },
  expiredText: { fontSize: 18 },
  refreshBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  refreshText: { fontSize: 14 },
  qrPlaceholder: { width: 240, height: 240, backgroundColor: '#F0F0F0' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerText: { fontSize: 16 },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, alignSelf: 'stretch' },
  urlLabel: { fontSize: 11 },
  urlValue: { flex: 1, fontSize: 12 },
  bottom: { padding: 20, gap: 10 },
});
