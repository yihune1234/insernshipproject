import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { useColors } from '@/hooks/useColors';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySurface, borderRadius: 40 }]}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="outline" fullWidth={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 18, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  action: { marginTop: 8 },
});
