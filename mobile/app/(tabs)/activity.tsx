import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityItem } from '@/components/shared/ActivityItem';
import { SafeScreen } from '@/components/shared/SafeScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActivities } from '@/contexts/ActivitiesContext';
import { groupByDate } from '@/utils/date';
import { useColors } from '@/hooks/useColors';
import type { MockActivity } from '@/services/mockData';

const FILTER_TABS: { label: string; type: MockActivity['type'] | 'ALL' }[] = [
  { label: 'All', type: 'ALL' },
  { label: 'Issued', type: 'ISSUED' },
  { label: 'Shared', type: 'SHARED' },
  { label: 'Verified', type: 'VERIFIED' },
  { label: 'Received', type: 'RECEIVED' },
  { label: 'Login', type: 'LOGIN' },
];

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities, refreshActivities } = useActivities();
  const [activeFilter, setActiveFilter] = useState<'ALL' | MockActivity['type']>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refreshActivities(); } catch { /* offline */ }
    finally { setRefreshing(false); }
  }, [refreshActivities]);

  const filtered = useMemo(() => {
    if (activeFilter === 'ALL') return activities;
    return activities.filter((a) => a.type === activeFilter);
  }, [activities, activeFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <SafeScreen style={{ backgroundColor: colors.backgroundAlt }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: 16, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
          Activity
        </Text>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="filter-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filtersScroll, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTER_TABS.map((f) => {
          const active = activeFilter === f.type;
          return (
            <Pressable
              key={f.label}
              onPress={() => setActiveFilter(f.type)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: active ? colors.primary : 'transparent',
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: 20,
                  borderWidth: 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color: active ? '#FFFFFF' : colors.textMuted,
                    fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                  },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="clipboard-outline"
          title="No activity yet"
          subtitle="Your credential events will appear here."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {Object.entries(grouped).map(([date, items]) => (
            <View key={date}>
              <Text style={[styles.dateLabel, { color: colors.textSubtle, fontFamily: 'Poppins_600SemiBold', borderBottomColor: colors.border }]}>
                {date}
              </Text>
              <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                {(items as MockActivity[]).map((item, i) => (
                  <View key={item.id}>
                    <ActivityItem
                      activity={item as MockActivity}
                      isLast={i === items.length - 1}
                    />
                    {i < items.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24 },
  iconBtn: { padding: 6 },
  filtersScroll: { maxHeight: 52, borderBottomWidth: 1 },
  filtersContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6 },
  filterTabText: { fontSize: 13 },
  list: { padding: 16, gap: 8 },
  dateLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  group: { borderWidth: 1, padding: 16 },
  sep: { height: 1, marginVertical: 8 },
});
