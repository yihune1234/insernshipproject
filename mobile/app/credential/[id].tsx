import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SafeScreen } from '@/components/shared/SafeScreen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCredentials } from '@/contexts/CredentialsContext';
import { formatDate } from '@/utils/date';
import { shiftColor } from '@/utils/colors';
import { formatKey } from '@/utils/strings';
import { useColors } from '@/hooks/useColors';

const SECTOR_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  school: 'school-outline', 'document-text': 'document-text-outline',
  card: 'card-outline', car: 'car-outline', medkit: 'medkit-outline',
  briefcase: 'briefcase-outline', cloud: 'cloud-outline', ribbon: 'ribbon-outline',
};

export default function CredentialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { credentials, isLoadingCredentials } = useCredentials();
  const [showJson, setShowJson] = useState(false);

  const credential = useMemo(
    () => credentials.find(c => c.id === id) ?? null,
    [credentials, id],
  );

  const handleDownload = async () => {
    if (!credential) return;
    try {
      const credJson = JSON.stringify({
        id: credential.id,
        type: credential.type,
        issuer: credential.issuer.did,
        issuerName: credential.issuer.name,
        holderDid: credential.holderDid,
        credentialSubject: credential.credentialSubject,
        issuanceDate: credential.issuanceDate,
        status: credential.status,
        proofFormat: credential.proofFormat,
      }, null, 2);

      await Share.share({
        message: credJson,
        title: `Credential: ${credential.title}`,
      });
    } catch {
      // User cancelled share
    }
  };

  if (isLoadingCredentials) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }
  if (!credential) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Credential not found</Text>
        <Button label="Go Back" onPress={() => router.back()} variant="ghost" fullWidth={false} />
      </View>
    );
  }

  const iconName = SECTOR_ICONS[credential.icon] ?? 'document-outline';
  const isExpiringSoon = credential.expiryDate && new Date(credential.expiryDate).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000;
  const displayStatus = isExpiringSoon && credential.status === 'ACTIVE' ? 'EXPIRING' : credential.status;

  return (
    <SafeScreen style={{ backgroundColor: colors.backgroundAlt }}>
      <LinearGradient
        colors={[credential.color, shiftColor(credential.color, -40)]}
        style={[styles.visualCard, { paddingTop: 16 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.visualHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.visualBody}>
          <View style={[styles.visIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name={iconName} size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.visTitle, { fontFamily: 'Poppins_700Bold' }]}>{credential.title}</Text>
          <Text style={[styles.visSubtitle, { fontFamily: 'Poppins_400Regular' }]}>{credential.subtitle}</Text>
          <View style={styles.visFooter}>
            <View>
              <Text style={[styles.visHolder, { fontFamily: 'Poppins_600SemiBold' }]}>
                {String(credential.credentialSubject.givenName ?? '')} {String(credential.credentialSubject.familyName ?? '')}
              </Text>
              <Text style={[styles.visDate, { fontFamily: 'Poppins_400Regular' }]}>{formatDate(credential.issuanceDate)}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.badgeRow}><Badge status={displayStatus} /></View>

        <SectionBlock title="Credential Details" colors={colors}>
          {Object.entries(credential.credentialSubject).map(([k, v]) => (
            <FieldRow key={k} label={formatKey(k)} value={String(v)} colors={colors} />
          ))}
        </SectionBlock>

        <SectionBlock title="Issuer" colors={colors}>
          <FieldRow label="Name" value={credential.issuer.name} colors={colors} />
          <FieldRow label="DID" value={credential.issuer.did} colors={colors} mono />
        </SectionBlock>
        {credential.status === 'ACTIVE' && (
          <View style={verifiedStyles.badge}>
            <Ionicons name="shield-checkmark" size={14} color="#2a7a5e" />
            <View style={{ flex: 1 }}>
              <Text style={verifiedStyles.title}>
                Verified by {credential.issuer.name ? `${credential.issuer.name}'s` : 'issuer'} records
              </Text>
              <Text style={verifiedStyles.sub}>
                Data verified directly from {credential.issuer.name || 'issuer'}'s database at issuance
              </Text>
            </View>
          </View>
        )}

        <SectionBlock title="Validity" colors={colors}>
          <FieldRow label="Issued" value={formatDate(credential.issuanceDate)} colors={colors} />
          <FieldRow label="Expires" value={credential.expiryDate ? formatDate(credential.expiryDate) : 'No expiry'} colors={colors} />
          <FieldRow label="Proof Format" value={credential.proofFormat} colors={colors} />
        </SectionBlock>

        <Pressable
          onPress={() => setShowJson(!showJson)}
          style={[styles.jsonToggle, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
        >
          <Ionicons name={showJson ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
          <Text style={[styles.jsonToggleText, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
            {showJson ? 'Hide' : 'View'} Raw Credential JSON
          </Text>
        </Pressable>
        {showJson && (
          <View style={[styles.jsonBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.jsonText, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
              {JSON.stringify({ id: credential.id, type: credential.type, issuer: credential.issuer.did, credentialSubject: credential.credentialSubject }, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        <ActionBtn icon="share-social-outline" label="Share" onPress={() => router.push({ pathname: '/share', params: { credentialId: credential.id } })} colors={colors} />
        <ActionBtn icon="qr-code-outline" label="QR Code" onPress={() => router.push({ pathname: '/qr-display', params: { credentialId: credential.id } })} colors={colors} />
        <ActionBtn icon="download-outline" label="Download" onPress={handleDownload} colors={colors} />
      </View>
    </SafeScreen>
  );
}

function SectionBlock({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={blockStyles.block}>
      <Text style={[blockStyles.title, { color: colors.textSubtle, fontFamily: 'Poppins_600SemiBold', borderBottomColor: colors.border }]}>{title.toUpperCase()}</Text>
      <View style={[blockStyles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>{children}</View>
    </View>
  );
}
function FieldRow({ label, value, colors, mono = false }: { label: string; value: string; colors: ReturnType<typeof useColors>; mono?: boolean }) {
  return (
    <View style={fieldStyles.row}>
      <Text style={[fieldStyles.label, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>{label}</Text>
      <Text style={[fieldStyles.value, { color: colors.text, fontFamily: mono ? 'Poppins_400Regular' : 'Poppins_500Medium' }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}
function ActionBtn({ icon, label, onPress, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [actionStyles.btn, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[actionStyles.icon, { backgroundColor: colors.primarySurface }]}><Ionicons name={icon} size={22} color={colors.primary} /></View>
      <Text style={[actionStyles.label, { color: colors.textMuted, fontFamily: 'Poppins_500Medium' }]}>{label}</Text>
    </Pressable>
  );
}
// formatKey moved to utils/strings.ts

const styles = StyleSheet.create({
  container: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  visualCard: { paddingHorizontal: 20, paddingBottom: 24 },
  visualHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 4 },
  visualBody: { gap: 8 },
  visIconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  visTitle: { fontSize: 22, color: '#FFFFFF' }, visSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  visFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  visHolder: { fontSize: 14, color: '#FFFFFF' }, visDate: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  content: { padding: 16, gap: 12 }, badgeRow: { flexDirection: 'row', gap: 8 },
  jsonToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderWidth: 1 },
  jsonToggleText: { fontSize: 14 }, jsonBox: { borderWidth: 1, padding: 14 },
  jsonText: { fontSize: 11, lineHeight: 18 },
  actionBar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12, paddingHorizontal: 16, gap: 8 },
});
const blockStyles = StyleSheet.create({
  block: { gap: 6 }, title: { fontSize: 11, letterSpacing: 0.8, paddingBottom: 6, borderBottomWidth: 1 },
  card: { borderWidth: 1, overflow: 'hidden' },
});
const fieldStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, gap: 12 },
  label: { fontSize: 13, flex: 1 }, value: { fontSize: 13, flex: 1.5, textAlign: 'right' },
});
const actionStyles = StyleSheet.create({
  btn: { flex: 1, alignItems: 'center', gap: 6 },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12 },
});
const verifiedStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#e8f5ee', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  title: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#1e5c42' },
  sub: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#3a7d5e', marginTop: 1 },
});