import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { MockCredential } from '@/services/mockData';
import { useColors } from '@/hooks/useColors';
import { formatDate } from '@/utils/date';
import { shiftColor } from '@/utils/colors';

interface CredentialCardProps {
  credential: MockCredential;
  onPress?: () => void;
  compact?: boolean;
}

const SECTOR_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  school: 'school-outline',
  'document-text': 'document-text-outline',
  card: 'card-outline',
  car: 'car-outline',
  medkit: 'medkit-outline',
  briefcase: 'briefcase-outline',
  cloud: 'cloud-outline',
  ribbon: 'ribbon-outline',
};

export function CredentialCard({ credential, onPress, compact = false }: CredentialCardProps) {
  const colors = useColors();
  const iconName = SECTOR_ICONS[credential.icon] ?? 'document-outline';
  const isExpiringSoon =
    credential.expiryDate &&
    new Date(credential.expiryDate).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000;
  const displayStatus =
    isExpiringSoon && credential.status === 'ACTIVE' ? 'EXPIRING' : credential.status;

  if (compact) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
        <LinearGradient
          colors={[credential.color, shiftColor(credential.color, -30)]}
          style={[styles.compactCard, { borderRadius: colors.radius + 4 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.compactTop}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name={iconName} size={18} color="#FFFFFF" />
            </View>
            <Badge status={displayStatus} size="sm" />
          </View>
          <Text style={[styles.compactTitle, { fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={2}>
            {credential.title}
          </Text>
          <Text style={[styles.compactSubtitle, { fontFamily: 'Poppins_400Regular' }]} numberOfLines={1}>
            {credential.issuer.name}
          </Text>
          <Text style={[styles.compactDate, { fontFamily: 'Poppins_400Regular' }]}>
            {formatDate(credential.issuanceDate)}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.listCard,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: credential.color }]} />
      <View style={[styles.iconCircle, { backgroundColor: credential.color + '22' }]}>
        <Ionicons name={iconName} size={22} color={credential.color} />
      </View>
      <View style={styles.listContent}>
        <View style={styles.listTop}>
          <Text
            style={[styles.listTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}
            numberOfLines={1}
          >
            {credential.title}
          </Text>
          <Badge status={displayStatus} size="sm" />
        </View>
        <Text
          style={[styles.listSubtitle, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}
          numberOfLines={1}
        >
          {credential.subtitle}
        </Text>
        <Text
          style={[styles.listMeta, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}
        >
          {credential.issuer.name}
          {credential.expiryDate
            ? `  ·  Expires: ${formatDate(credential.expiryDate)}`
            : '  ·  No expiry'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    width: 180,
    height: 130,
    padding: 14,
    justifyContent: 'space-between',
    marginRight: 12,
  },
  compactTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitle: { fontSize: 13, color: '#FFFFFF', marginTop: 4 },
  compactSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  compactDate: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  listContent: { flex: 1, gap: 3 },
  listTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  listTitle: { fontSize: 14, flex: 1 },
  listSubtitle: { fontSize: 12 },
  listMeta: { fontSize: 11 },
});
