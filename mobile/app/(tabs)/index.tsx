import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityItem } from '@/components/shared/ActivityItem';
import { CredentialCard } from '@/components/shared/CredentialCard';
import { SafeScreen } from '@/components/shared/SafeScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useCredentials } from '@/contexts/CredentialsContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { useColors } from '@/hooks/useColors';
import { getUnreadCount, subscribe } from '@/services/notifications/notificationService';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { citizen } = useAuth();
  const { credentials, isLoadingCredentials, refreshCredentials } = useCredentials();
  const { activities, refreshActivities } = useActivities();
  const { isOnline, syncStatus, syncNow } = useNetwork();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {});
    const unsub = subscribe((notifs) => setUnreadCount(notifs.filter(n => !n.is_read).length));
    return unsub;
  }, []);

  const activeCount = credentials.filter((c) => c.status === 'ACTIVE').length;
  const expiringCount = credentials.filter(
    (c) =>
      c.expiryDate &&
      c.status === 'ACTIVE' &&
      new Date(c.expiryDate).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000
  ).length;

  const recentActivities = activities.slice(0, 3);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (isOnline) {
        await syncNow();
        await Promise.all([refreshCredentials(), refreshActivities()]);
      } else {
        await Promise.all([refreshCredentials(), refreshActivities()]);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const quickActions = [
    { icon: 'scan-outline' as const, label: 'Scan QR', onPress: () => router.push('/(tabs)/scan') },
    { icon: 'share-social-outline' as const, label: 'Share', onPress: () => router.push('/(tabs)/credentials') },
    { icon: 'download-outline' as const, label: 'Request', onPress: () => router.push('/request-credential') },
    { icon: 'checkmark-circle-outline' as const, label: 'Verify', onPress: () => router.push('/(tabs)/scan') },
  ];

  return (
    <SafeScreen style={{ backgroundColor: colors.backgroundAlt }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={[styles.headerGrad, { paddingTop: 16 }]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/(tabs)/settings')}>
            <Image
              source={{ uri: citizen?.photo }}
              style={[styles.avatar, { borderColor: colors.gold }]}
              contentFit="cover"
            />
          </Pressable>
          <View style={styles.wordmark}>
            <Text style={[styles.appNameSmall, { fontFamily: 'Poppins_600SemiBold' }]}>Debo Wallet</Text>
          </View>
          <Pressable style={styles.bell} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: colors.gold }]}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: colors.radius + 4 }]}>
          <View style={styles.profileRow}>
            <Image
              source={{ uri: citizen?.photo }}
              style={styles.profileAvatar}
              contentFit="cover"
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { fontFamily: 'Poppins_700Bold' }]}>{citizen?.fullName}</Text>
              <Text style={[styles.profileId, { fontFamily: 'Poppins_400Regular' }]}>{citizen?.nationalId}</Text>
              <Text style={[styles.profileDid, { fontFamily: 'Poppins_400Regular' }]} numberOfLines={1}>
                {citizen?.did.slice(0, 30)}…
              </Text>
            </View>
          </View>
          <View style={[styles.goldAccent, { backgroundColor: colors.gold }]} />
          <View style={styles.walletStatus}>
            <View style={styles.statusDot} />
            <Text style={[styles.statusText, { fontFamily: 'Poppins_500Medium' }]}>Wallet Active</Text>
          </View>
        </View>
        <View style={styles.headerBottomPad} />
      </LinearGradient>

      {/* Offline / Sync banner */}
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: '#92400E' }]}>
          <Ionicons name="cloud-offline-outline" size={15} color="#FEF3C7" />
          <Text style={[styles.offlineBannerText, { fontFamily: 'Poppins_500Medium' }]}>
            Offline — showing cached data
          </Text>
        </View>
      )}
      {isOnline && syncStatus.isSyncing && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.primarySurface }]}>
          <Ionicons name="sync-outline" size={15} color={colors.primary} />
          <Text style={[styles.offlineBannerText, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
            Syncing…
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Row */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
          {[
            { label: 'Total', value: credentials.length },
            { label: 'Active', value: activeCount },
            { label: 'Expiring', value: expiringCount },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: i === 2 && expiringCount > 0 ? colors.warning : colors.primary, fontFamily: 'Poppins_700Bold' }]}>
                  {s.value}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActions}>
          {quickActions.map((a) => (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              style={({ pressed }) => [
                styles.quickAction,
                { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={[styles.qaIcon, { backgroundColor: colors.primarySurface }]}>
                <Ionicons name={a.icon} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.qaLabel, { color: colors.textMuted, fontFamily: 'Poppins_500Medium' }]}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Credentials */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
            My Credentials
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/credentials')}>
            <Text style={[styles.seeAll, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
              See All
            </Text>
          </Pressable>
        </View>

        {isLoadingCredentials ? (
          <View style={styles.loadingWrap}>
            <Text style={[styles.loadingText, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
              Loading credentials…
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.credScroll}>
            {credentials.slice(0, 6).map((c) => (
              <CredentialCard
                key={c.id}
                credential={c}
                compact
                onPress={() => router.push(`/credential/${c.id}`)}
              />
            ))}
          </ScrollView>
        )}

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
            Recent Activity
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/activity')}>
            <Text style={[styles.seeAll, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
              View All
            </Text>
          </Pressable>
        </View>

        <View style={[styles.activityCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
          {recentActivities.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
              No recent activity
            </Text>
          ) : (
            recentActivities.map((a, i) => (
              <ActivityItem key={a.id} activity={a} isLast={i === recentActivities.length - 1} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2 },
  wordmark: { flex: 1, alignItems: 'center' },
  appNameSmall: { fontSize: 18, color: '#FFFFFF', letterSpacing: 0.5 },
  bell: { position: 'relative', padding: 4 },
  bellDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4 },
  bellBadge: {
    position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '700', color: '#1B4332' },
  profileCard: { padding: 16, marginBottom: 0 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28 },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: 18, color: '#FFFFFF' },
  profileId: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  profileDid: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  goldAccent: { height: 2, marginTop: 12, borderRadius: 1 },
  walletStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  statusText: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  headerBottomPad: { height: 16 },
  offlineBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  offlineBannerText: { fontSize: 12, color: '#FEF3C7', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8 },
  statsCard: { flexDirection: 'row', borderWidth: 1, padding: 16, marginBottom: 8 },
  statDivider: { width: 1 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 28 },
  statLabel: { fontSize: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectionTitle: { fontSize: 16, marginBottom: 10, marginTop: 8 },
  seeAll: { fontSize: 13 },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  quickAction: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 14, borderWidth: 1, gap: 8 },
  qaIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 11, textAlign: 'center' },
  credScroll: { marginHorizontal: -4 },
  loadingWrap: { height: 130, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14 },
  activityCard: { padding: 16, borderWidth: 1 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});
