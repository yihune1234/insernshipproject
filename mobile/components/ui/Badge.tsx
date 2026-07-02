import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

type Status = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'SUSPENDED' | 'EXPIRING';

interface BadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export function Badge({ status, size = 'md' }: BadgeProps) {
  const colors = useColors();

  const config: Record<Status, { label: string; bg: string; text: string }> = {
    ACTIVE: { label: 'Active', bg: colors.successSurface, text: colors.success },
    REVOKED: { label: 'Revoked', bg: colors.errorSurface, text: colors.error },
    EXPIRED: { label: 'Expired', bg: colors.muted, text: colors.mutedForeground },
    SUSPENDED: { label: 'Suspended', bg: colors.warningSurface, text: colors.warning },
    EXPIRING: { label: 'Expires Soon', bg: colors.warningSurface, text: colors.warning },
  };

  const { label, bg, text } = config[status] ?? config.ACTIVE;
  const fontSize = size === 'sm' ? 10 : 11;
  const padding = size === 'sm' ? { paddingHorizontal: 6, paddingVertical: 2 } : { paddingHorizontal: 8, paddingVertical: 3 };

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: 20 }, padding]}>
      <View style={[styles.dot, { backgroundColor: text }]} />
      <Text style={[styles.text, { color: text, fontSize, fontFamily: 'Poppins_500Medium' }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  text: {
    letterSpacing: 0.2,
  },
});
