import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SafeScreen } from '@/components/shared/SafeScreen';
import { Button } from '@/components/ui/Button';
import { sharingApi } from '@/services/sharing/sharingApi';
import { useCredentials } from '@/contexts/CredentialsContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { Stepper } from '@/components/ui/Stepper';
import { useColors } from '@/hooks/useColors';
import { formatKey } from '@/utils/strings';
import { getTopPadding } from '@/utils/layout';

type Step = 'claims' | 'expiry' | 'result';

const EXPIRY_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 168 },
  { label: '30 days', hours: 720 },
  { label: 'No expiry', hours: 0 },
];

export default function ShareScreen() {
  const { credentialId } = useLocalSearchParams<{ credentialId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { credentials } = useCredentials();
  const { addActivity } = useActivities();
  const credential = credentials.find(c => c.id === credentialId) ?? credentials[0] ?? null;

  const claimKeys = useMemo(() => {
    if (!credential) return [];
    return Object.keys(credential.credentialSubject).filter(k => {
      const v = credential.credentialSubject[k];
      return v !== undefined && v !== null && String(v).trim() !== '';
    });
  }, [credential]);

  const [step, setStep] = useState<Step>('claims');
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set(claimKeys));
  const [expiryHours, setExpiryHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [shareToken, setShareToken] = useState('');

  const toggleClaim = (key: string) => {
    setSelectedClaims(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedClaims.size === claimKeys.length) setSelectedClaims(new Set());
    else setSelectedClaims(new Set(claimKeys));
  };

  const handleCreateShare = async () => {
    if (!credential) return;
    if (selectedClaims.size === 0) {
      setError('Select at least one claim to disclose');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await sharingApi.enableSharing({
        credential_id: credential.id,
        disclosed_claims: Array.from(selectedClaims),
        ...(expiryHours > 0 ? { expires_in_hours: expiryHours } : {}),
      } as Parameters<typeof sharingApi.enableSharing>[0]);

      setShareUrl(res.share_url);
      setShareToken(res.share_token);
      setStep('result');

      addActivity({
        action: 'Credential Shared',
        actionType: 'CREDENTIAL_SHARED',
        credentialId: credential.id,
        credentialType: credential.type,
        issuerName: credential.issuer.name,
        timestamp: new Date().toISOString(),
        details: `Shared ${selectedClaims.size} claim(s)`,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      Clipboard.setString(shareUrl);
      Alert.alert('Copied', 'Share link copied to clipboard');
    } catch {
      Alert.alert('Share URL', shareUrl);
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    try {
      await Share.share({ message: shareUrl, url: shareUrl });
    } catch {}
  };

  if (!credential) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
          <View style={[styles.header, { paddingTop: getTopPadding(insets) + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Share Credential</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.center}>
          <Text style={{ color: colors.textMuted }}>No credential selected</Text>
          <Button label="Go Back" onPress={() => router.back()} variant="ghost" fullWidth={false} />
        </View>
      </View>
    );
  }

  return (
    <SafeScreen style={{ backgroundColor: colors.backgroundAlt }}>
      <View style={[styles.header, { paddingTop: 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => step === 'claims' ? router.back() : setStep(step === 'expiry' ? 'claims' : 'expiry')} style={styles.back}>
          <Ionicons name={step === 'claims' ? 'close' : 'arrow-back'} size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
          {step === 'claims' ? 'Select Claims' : step === 'expiry' ? 'Set Expiry' : 'Share Ready'}
        </Text>
        <View style={styles.spacer} />
      </View>

      <Stepper current={['claims', 'expiry', 'result'].indexOf(step) + 1} total={3} />

      {/* Credential preview chip */}
      <View style={[styles.credChip, { backgroundColor: credential.color + '18', borderColor: credential.color + '40' }]}>
        <View style={[styles.credDot, { backgroundColor: credential.color }]} />
        <Text style={[styles.credChipText, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
          {credential.title} · {credential.issuer.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.errorSurface, borderRadius: colors.radius }]}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error, fontFamily: 'Poppins_400Regular' }]}>{error}</Text>
          </View>
        ) : null}

        {/* Step 1: Claims selection */}
        {step === 'claims' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                Choose what to disclose
              </Text>
              <Pressable onPress={toggleAll}>
                <Text style={[styles.toggleAll, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
                  {selectedClaims.size === claimKeys.length ? 'Deselect All' : 'Select All'}
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.sectionSub, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
              Only the selected fields will be visible to the verifier.
            </Text>

            <View style={[styles.claimsList, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              {claimKeys.map((key, i) => {
                const checked = selectedClaims.has(key);
                return (
                  <View key={key}>
                    {i > 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
                    <Pressable onPress={() => toggleClaim(key)} style={styles.claimRow}>
                      <View style={[styles.checkbox, {
                        backgroundColor: checked ? colors.primary : 'transparent',
                        borderColor: checked ? colors.primary : colors.border,
                      }]}>
                        {checked && <Ionicons name="checkmark" size={12} color="#FFF" />}
                      </View>
                      <View style={styles.claimInfo}>
                        <Text style={[styles.claimKey, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
                          {formatKey(key)}
                        </Text>
                        <Text style={[styles.claimValue, { color: colors.text, fontFamily: 'Poppins_500Medium' }]} numberOfLines={1}>
                          {String(credential.credentialSubject[key])}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={[styles.notice, { backgroundColor: colors.infoSurface, borderRadius: colors.radius }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.info} />
              <Text style={[styles.noticeText, { color: colors.info, fontFamily: 'Poppins_400Regular' }]}>
                {selectedClaims.size} of {claimKeys.length} fields selected. You control what you share.
              </Text>
            </View>

            <Button
              label={`Continue with ${selectedClaims.size} claim(s)`}
              onPress={() => setStep('expiry')}
              disabled={selectedClaims.size === 0}
            />
          </>
        )}

        {/* Step 2: Expiry selection */}
        {step === 'expiry' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
              Set Link Expiry
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
              After this time the link will no longer be accessible.
            </Text>

            <View style={[styles.expiryList, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              {EXPIRY_OPTIONS.map((opt, i) => {
                const selected = opt.hours === expiryHours;
                return (
                  <View key={opt.label}>
                    {i > 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
                    <Pressable onPress={() => setExpiryHours(opt.hours)} style={styles.expiryRow}>
                      <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.border }]}>
                        {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                      </View>
                      <Text style={[styles.expiryLabel, { color: colors.text, fontFamily: selected ? 'Poppins_600SemiBold' : 'Poppins_400Regular' }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Button
              label={loading ? 'Creating Share…' : 'Create Share Link'}
              onPress={handleCreateShare}
              loading={loading}
            />
          </>
        )}

        {/* Step 3: Result */}
        {step === 'result' && (
          <>
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.resultIcon, { backgroundColor: colors.successSurface }]}>
                <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              </View>
              <Text style={[styles.resultTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
                Share Link Created
              </Text>
              <Text style={[styles.resultSub, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
                {selectedClaims.size} claim(s) · {EXPIRY_OPTIONS.find(o => o.hours === expiryHours)?.label ?? 'No expiry'}
              </Text>
            </View>

            {shareToken ? (
              <View style={[styles.qrWrap, { backgroundColor: '#FFFFFF', borderColor: colors.border, borderRadius: colors.radius + 8 }]}>
                <QRCode value={shareUrl || shareToken} size={220} color="#000000" backgroundColor="#FFFFFF" />
              </View>
            ) : null}

            <View style={[styles.urlBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.urlLabel, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>Share URL</Text>
              <Text style={[styles.urlText, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]} numberOfLines={2}>
                {shareUrl}
              </Text>
            </View>

            <Button label="Copy Link" onPress={handleCopyLink} />
            <Button label="Share via Apps" onPress={handleNativeShare} variant="outline" />
            <Button label="Show QR Code Full Screen" onPress={() => router.push({ pathname: '/qr-display', params: { credentialId: credential.id, shareToken } })} variant="ghost" />
            <Button label="Done" onPress={() => router.back()} variant="ghost" />
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

// formatKey moved to utils/strings.ts

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  back: { padding: 4 },
  headerTitle: { fontSize: 18 },
  spacer: { width: 32 },
  progress: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 0, borderBottomWidth: 1,
  },
  progressItem: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  progressNum: { fontSize: 11, fontWeight: '700' },
  progressLine: { width: 40, height: 2, marginHorizontal: 4 },
  credChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, margin: 16, borderRadius: 8,
  },
  credDot: { width: 8, height: 8, borderRadius: 4 },
  credChipText: { flex: 1, fontSize: 13 },
  content: { paddingHorizontal: 16, gap: 12 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  errorText: { flex: 1, fontSize: 13 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16 },
  sectionSub: { fontSize: 13, lineHeight: 20, marginTop: -4 },
  toggleAll: { fontSize: 13 },
  claimsList: { borderWidth: 1, overflow: 'hidden' },
  claimRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 14 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  claimInfo: { flex: 1, gap: 1 },
  claimKey: { fontSize: 11, letterSpacing: 0.3 },
  claimValue: { fontSize: 14 },
  sep: { height: 1, marginLeft: 52 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12 },
  noticeText: { fontSize: 12, flex: 1, lineHeight: 18 },
  expiryList: { borderWidth: 1, overflow: 'hidden' },
  expiryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  expiryLabel: { fontSize: 15 },
  resultCard: {
    borderWidth: 1, alignItems: 'center', padding: 24, gap: 8,
  },
  resultIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 18 },
  resultSub: { fontSize: 13 },
  qrWrap: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, padding: 24, alignSelf: 'center',
  },
  urlBox: { borderWidth: 1, padding: 14, gap: 4 },
  urlLabel: { fontSize: 11, letterSpacing: 0.5 },
  urlText: { fontSize: 12, lineHeight: 18 },
});
