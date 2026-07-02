import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SafeScreen } from '@/components/shared/SafeScreen';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  type WalletNotification,
  deleteNotification,
  fetchNotifications,
  markAllRead,
  markAsRead,
  subscribe,
} from '@/services/notifications/notificationService';
import { useColors } from '@/hooks/useColors';
import { formatDate } from '@/utils/date';

function NotificationItem({
  item,
  onRead,
  onDelete,
  colors,
}: {
  item: WalletNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    CREDENTIAL_ISSUED: 'document-text-outline',
    CREDENTIAL_REVOKED: 'close-circle-outline',
    CREDENTIAL_EXPIRING: 'time-outline',
    SHARE_ACCESSED: 'eye-outline',
    SYSTEM: 'information-circle-outline',
  };
  const icon = iconMap[item.type] ?? 'notifications-outline';

  return (
    <Pressable
      onPress={() => !item.is_read && onRead(item.id)}
      style={[
        styles.item,
        {
          backgroundColor: item.is_read ? colors.card : colors.primarySurface,
          borderColor: item.is_read ? colors.border : colors.primary + '40',
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={[styles.itemIcon, { backgroundColor: item.is_read ? colors.muted : colors.primarySurface }]}>
        <Ionicons name={icon} size={20} color={item.is_read ? colors.textMuted : colors.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: colors.text, fontFamily: item.is_read ? 'Poppins_400Regular' : 'Poppins_600SemiBold' }]}>
          {item.title}
        </Text>
        <Text style={[styles.itemMessage, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={[styles.itemDate, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      {!item.is_read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
      <Pressable onPress={() => onDelete(item.id)} style={styles.deleteBtn} hitSlop={8}>
        <Ionicons name="close" size={16} color={colors.textSubtle} />
      </Pressable>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<WalletNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = subscribe(setNotifications);
    return unsub;
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeScreen style={{ backgroundColor: colors.backgroundAlt }}>
      <View style={[styles.header, { paddingTop: 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
          Notifications
        </Text>
        {unreadCount > 0 ? (
          <Pressable onPress={handleMarkAllRead} style={styles.markAll}>
            <Text style={[styles.markAllText, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
              Mark all read
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primarySurface }]}>
          <Ionicons name="notifications" size={14} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications"
          subtitle="Credential updates, share access, and important alerts will appear here."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onRead={handleRead}
              onDelete={handleDelete}
              colors={colors}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  back: { padding: 4 },
  headerTitle: { fontSize: 20 },
  markAll: { padding: 4 },
  markAllText: { fontSize: 13 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  badgeText: { fontSize: 13 },
  list: { padding: 16 },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderWidth: 1,
  },
  itemIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  itemContent: { flex: 1, gap: 3 },
  itemTitle: { fontSize: 14 },
  itemMessage: { fontSize: 12, lineHeight: 18 },
  itemDate: { fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  deleteBtn: { padding: 4, marginTop: 2 },
});
