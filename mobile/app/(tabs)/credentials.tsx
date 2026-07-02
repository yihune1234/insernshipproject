import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CredentialCard } from '@/components/shared/CredentialCard';
import { SafeScreen } from '@/components/shared/SafeScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCredentials } from '@/contexts/CredentialsContext';
import { useColors } from '@/hooks/useColors';
import { MockCredential } from '@/services/mockData';

type StatusFilter = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Revoked', value: 'REVOKED' },
  { label: 'Suspended', value: 'SUSPENDED' },
];

function SkeletonCard({ colors }: { colors: ReturnType<typeof import('@/hooks/useColors').useColors> }) {
  return (
    <View style={[skStyles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={[skStyles.line, { backgroundColor: colors.border, width: '60%' }]} />
      <View style={[skStyles.line, { backgroundColor: colors.border, width: '40%', height: 10 }]} />
      <View style={skStyles.row}>
        <View style={[skStyles.chip, { backgroundColor: colors.border }]} />
        <View style={[skStyles.chip, { backgroundColor: colors.border, width: 60 }]} />
      </View>
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: { padding: 16, gap: 10, borderWidth: 1, marginBottom: 8 },
  line: { height: 14, borderRadius: 7 },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: { height: 24, width: 80, borderRadius: 12 },
});

export default function CredentialsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { credentials, isLoadingCredentials, refreshCredentials } = useCredentials();
  const [activeTab, setActiveTab] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    if (!isLoadingCredentials) setFirstLoad(false);
  }, [isLoadingCredentials]);

  const filtered = useMemo(() => {
    let list = credentials;
    if (activeTab !== 'ALL') {
      list = list.filter((c) => c.status === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.issuer.name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [credentials, activeTab, search]);

  const countFor = (v: StatusFilter) =>
    v === 'ALL' ? credentials.length : credentials.filter(c => c.status === v).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCredentials().catch(() => {});
    setRefreshing(false);
  };

  return (
    <SafeScreen style={{ backgroundColor: colors.backgroundAlt }}>
      <View style={[styles.header, { paddingTop: 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>My Credentials</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowSearch(!showSearch)} style={styles.iconBtn}>
            <Ionicons name={showSearch ? 'close' : 'search'} size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => router.push('/request-credential')} style={styles.iconBtn}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textSubtle} />
          <TextInput
            autoFocus
            placeholder="Search credentials…"
            placeholderTextColor={colors.textSubtle}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}
          />
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsScroll, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUS_TABS.map((tab) => {
          const count = countFor(tab.value);
          const active = tab.value === activeTab;
          return (
            <Pressable
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={[styles.tab, {
                backgroundColor: active ? colors.primary : 'transparent',
                borderRadius: 20,
                borderColor: active ? colors.primary : colors.border,
                borderWidth: 1,
              }]}
            >
              <Text style={[styles.tabText, {
                color: active ? '#FFFFFF' : colors.textMuted,
                fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
              }]}>
                {tab.label}{count > 0 && ` ${count}`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {(firstLoad && isLoadingCredentials) ? (
        <View style={styles.list}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} colors={colors} />)}
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No credentials found"
          subtitle={activeTab === 'ALL'
            ? 'Credentials issued by universities, government offices, and employers will appear here.'
            : `No ${activeTab.toLowerCase()} credentials.`}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <CredentialCard
              credential={item}
              onPress={() => router.push(`/credential/${item.id}`)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, gap: 10, borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, height: 36 },
  tabsScroll: { maxHeight: 52, borderBottomWidth: 1 },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 6 },
  tabText: { fontSize: 13 },
  list: { padding: 16 },
});
