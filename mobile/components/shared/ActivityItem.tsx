import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MockActivity } from '@/services/mockData';
import { useColors } from '@/hooks/useColors';
import { formatTime } from '@/utils/date';

const ACTIVITY_CONFIG: Record<
  MockActivity['type'],
  { icon: keyof typeof Ionicons.glyphMap; color: string; bgKey: string }
> = {
  ISSUED: { icon: 'add-circle', color: '#1A6FAA', bgKey: 'info' },
  SHARED: { icon: 'share-social', color: '#B45309', bgKey: 'warning' },
  VERIFIED: { icon: 'checkmark-circle', color: '#1E8847', bgKey: 'success' },
  LOGIN: { icon: 'lock-open', color: '#7B3FA0', bgKey: 'primary' },
  RECEIVED: { icon: 'download', color: '#1A6FAA', bgKey: 'info' },
  REVOKED: { icon: 'close-circle', color: '#C0392B', bgKey: 'error' },
};

interface ActivityItemProps {
  activity: MockActivity;
  isLast?: boolean;
}

export function ActivityItem({ activity, isLast = false }: ActivityItemProps) {
  const colors = useColors();
  const cfg = ACTIVITY_CONFIG[activity.type];

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: cfg.color + '18', borderColor: cfg.color + '30', borderWidth: 1 },
          ]}
        >
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
        </View>
        {!isLast && <View style={[styles.line, { backgroundColor: colors.border }]} />}
      </View>
      <View style={[styles.content, !isLast && styles.contentPad]}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}
            numberOfLines={1}
          >
            {activity.title}
          </Text>
          <Text style={[styles.time, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
            {formatTime(activity.timestamp)}
          </Text>
        </View>
        <Text
          style={[styles.desc, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}
          numberOfLines={2}
        >
          {activity.description}
        </Text>
        {activity.method && (
          <Text style={[styles.method, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
            {activity.method}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  left: { alignItems: 'center', width: 40 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { flex: 1, width: 1.5, marginTop: 4 },
  content: { flex: 1, paddingTop: 8 },
  contentPad: { paddingBottom: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 14, flex: 1 },
  time: { fontSize: 11 },
  desc: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  method: { fontSize: 11, marginTop: 2 },
});
