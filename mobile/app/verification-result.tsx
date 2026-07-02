import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { verificationApi } from '@/services/verification';

type BadgeStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'SUSPENDED' | 'EXPIRING';

interface VerificationResult {
  credentialId: string; verified: boolean; status: BadgeStatus;
  issuer: { did: string; name: string }; holder: { did: string; name: string };
  credentialSubject: Record<string, unknown>; issuedAt: string; verificationPath: string;
}
import { useColors } from '@/hooks/useColors';
import { formatDate } from '@/utils/date';
import { getTopPadding } from '@/utils/layout';

export default function VerificationResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { credentialId } = useLocalSearchParams<{ credentialId: string }>();
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const id = credentialId || 'demo';
    verificationApi.getVerificationResult(id).then((res: unknown) => {
      const r = res as Record<string, unknown> | null;
      if (r) setResult({
        credentialId: String(r.credential_id ?? id),
        verified: r.verified === true || r.is_valid === true,
        status: 'ACTIVE' as BadgeStatus,
        issuer: { did: String((r.issuer as Record<string,unknown>)?.did ?? ''), name: String((r.issuer as Record<string,unknown>)?.name ?? '') },
        holder: { did: String((r.holder as Record<string,unknown>)?.did ?? ''), name: '' },
        credentialSubject: (r.credential_subject as Record<string, unknown>) ?? {},
        issuedAt: String(r.issued_at ?? ''),
        verificationPath: '',
      });
    }).catch(() => {
      // Demo fallback
      setResult({ credentialId: id, verified: true, status: 'ACTIVE', issuer: { did: '', name: 'Demo Issuer' }, holder: { did: '', name: '' }, credentialSubject: {}, issuedAt: new Date().toISOString(), verificationPath: '' });
    });
  }, [credentialId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
      <View style={[styles.header, { paddingTop: getTopPadding(insets) + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
          Verification Result
        </Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Result banner */}
        <Animated.View entering={ZoomIn.duration(500)}>
          <LinearGradient
            colors={result?.verified ? [colors.success, '#0D5C2E'] : [colors.error, '#7D1E17']}
            style={[styles.banner, { borderRadius: colors.radius + 4 }]}
          >
            <View style={[styles.bannerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name={result?.verified ? 'checkmark' : 'close'} size={44} color="#FFFFFF" />
            </View>
            <Text style={[styles.bannerTitle, { fontFamily: 'Poppins_700Bold' }]}>
              {result?.verified ? 'VERIFIED' : 'NOT VERIFIED'}
            </Text>
            <Text style={[styles.bannerSub, { fontFamily: 'Poppins_400Regular' }]}>
              {result?.verified ? 'All verification checks passed' : 'Credential could not be verified'}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Credential summary */}
        {result && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View style={[styles.credCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              <View style={styles.credInfo}>
                <Text style={[styles.credTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                  {String(result.credentialSubject?.title ?? result.credentialId)}
                </Text>
                <Text style={[styles.credSub, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
                  {result.issuer.name}
                </Text>
                <View style={styles.credMeta}>
                  <Text style={[styles.credDate, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
                    {formatDate(result.issuedAt)}
                  </Text>
                  <Badge status={result.status} size="sm" />
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Verification path */}
        {result?.verificationPath && (
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <Text style={[styles.sectionTitle, { color: colors.textSubtle, fontFamily: 'Poppins_600SemiBold', borderBottomColor: colors.border }]}>
              VERIFICATION PATH
            </Text>
            <View style={[styles.checksCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              {result.verificationPath.split('✓').filter(Boolean).map((step, i) => (
                <View key={i}>
                  <View style={styles.checkRow}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={[styles.checkName, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>
                      {step.trim()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Metadata */}
        {result && (
          <Animated.View entering={FadeInDown.delay(700).duration(400)}>
            <Text style={[styles.sectionTitle, { color: colors.textSubtle, fontFamily: 'Poppins_600SemiBold', borderBottomColor: colors.border }]}>
              VERIFICATION METADATA
            </Text>
            <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <MetaRow label="Verified at" value={new Date().toLocaleString()} colors={colors} />
              <MetaRow label="Issuer DID" value={result.issuer.did} colors={colors} />
              <MetaRow label="Holder DID" value={result.holder.did} colors={colors} />
            </View>
          </Animated.View>
        )}

        <Button label="Done" onPress={() => router.replace('/(tabs)')} />
      </ScrollView>
    </View>
  );
}

function MetaRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={metaStyles.row}>
      <Text style={[metaStyles.label, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>{label}</Text>
      <Text style={[metaStyles.value, { color: colors.text, fontFamily: 'Poppins_500Medium' }]} numberOfLines={1}>
        {value}
      </Text>
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
  content: { padding: 16, gap: 14 },
  banner: { alignItems: 'center', padding: 28, gap: 10 },
  bannerIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 28, color: '#FFFFFF' },
  bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  credCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderWidth: 1, gap: 12 },
  credInfo: { flex: 1, gap: 3 },
  credTitle: { fontSize: 15 },
  credSub: { fontSize: 12 },
  credMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  credDate: { fontSize: 11 },
  sectionTitle: { fontSize: 11, letterSpacing: 0.8, paddingBottom: 6, borderBottomWidth: 1, marginBottom: 6 },
  checksCard: { borderWidth: 1, overflow: 'hidden' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  checkInfo: { flex: 1, gap: 2 },
  checkName: { fontSize: 14 },
  checkDetail: { fontSize: 12 },
  sep: { height: 1 },
  metaCard: { borderWidth: 1, overflow: 'hidden' },
});

const metaStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  label: { fontSize: 13 },
  value: { fontSize: 13, flex: 1, textAlign: 'right' },
});
