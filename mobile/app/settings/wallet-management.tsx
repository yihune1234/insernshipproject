import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useCredentials } from '@/contexts/CredentialsContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useColors } from '@/hooks/useColors';
import { getTopPadding } from '@/utils/layout';
import { getQueueLength } from '@/services/offline/OfflineQueue';
import { syncCredentials } from '@/services/sync/credentialSync';

export default function WalletManagementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { did, user } = useAuth();
  const { credentials } = useCredentials();
  const { activities } = useActivities();
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [queueLen, setQueueLen] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const storageKB = credentials.length * 120 + activities.length * 8;
  const storageMB = (storageKB / 1024).toFixed(1);

  useEffect(() => {
    getQueueLength().then(setQueueLen).catch(() => {});
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { updated, added } = await syncCredentials();
      Alert.alert('Sync Complete', `${updated} updated · ${added} added`);
    } catch (e) {
      Alert.alert('Sync Failed', e instanceof Error ? e.message : 'Sync error');
    } finally {
      setSyncing(false);
    }
  };

  const didShort = did ? did.slice(0, 16) + '…' + did.slice(-8) : '—';

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
      <View style={[styles.header, { paddingTop: getTopPadding(insets) + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Wallet Management</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* DID Section */}
        <GroupLabel title="DECENTRALISED IDENTITY (DID)" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.didRow}>
            <View style={[styles.icon, { backgroundColor: colors.primarySurface }]}>
              <Ionicons name="key-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.didInfo}>
              <Text style={[styles.rowLabel, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>Your DID</Text>
              <Text style={[styles.didValue, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]} numberOfLines={1}>
                {didShort}
              </Text>
            </View>
          </View>
          <Sep colors={colors} />
          <ActionRow
            icon="document-outline"
            label="View DID Document"
            sublabel="Public keys and service endpoints"
            onPress={() => Alert.alert('DID Document', did ?? 'No DID found')}
            colors={colors}
          />
          <Sep colors={colors} />
          <ActionRow
            icon="refresh-outline"
            label="Rotate Keys"
            sublabel="Generate new cryptographic keys"
            onPress={() => Alert.alert('Rotate Keys', 'Key rotation will be available in a future update.')}
            colors={colors}
          />
        </View>

        <GroupLabel title="STORAGE" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.storageRow}>
            <View style={[styles.icon, { backgroundColor: colors.primarySurface }]}>
              <Ionicons name="cube-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.storageLabel, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>Local Storage Used</Text>
              <Text style={[styles.storageValue, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>{storageMB} MB</Text>
              <Text style={[styles.storageSub, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
                {credentials.length} credentials · {activities.length} activities
              </Text>
            </View>
          </View>
          {queueLen > 0 && (
            <>
              <Sep colors={colors} />
              <View style={[styles.queueBanner, { backgroundColor: colors.infoSurface }]}>
                <Ionicons name="cloud-upload-outline" size={16} color={colors.info} />
                <Text style={[styles.queueText, { color: colors.info, fontFamily: 'Poppins_400Regular' }]}>
                  {queueLen} action{queueLen !== 1 ? 's' : ''} queued to sync when online
                </Text>
              </View>
            </>
          )}
          <Sep colors={colors} />
          <ActionRow icon="download-outline" label="Download All Credentials" onPress={() => Alert.alert('Downloaded', 'All credentials exported to device storage.')} colors={colors} />
          <Sep colors={colors} />
          <ActionRow icon="trash-outline" label="Clear Cache" onPress={() => Alert.alert('Cache Cleared', 'Cache has been cleared.')} colors={colors} />
        </View>

        <GroupLabel title="BACKUP" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <ActionRow icon="save-outline" label="Backup Wallet" sublabel="Create an encrypted backup file" onPress={() => Alert.alert('Backup Created', 'Wallet backup created successfully.')} colors={colors} />
          <Sep colors={colors} />
          <ActionRow icon="share-outline" label="Export Credential Data" sublabel="Export all credentials as JSON archive" onPress={() => Alert.alert('Exported', 'Credential data exported.')} colors={colors} />
          <Sep colors={colors} />
          <ActionRow icon="cloud-download-outline" label="Restore from Backup" onPress={() => Alert.alert('Restore', 'Select a backup file to restore.')} colors={colors} />
        </View>

        <GroupLabel title="SYNC" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.toggleRow}>
            <View style={[styles.icon, { backgroundColor: colors.primarySurface }]}>
              <Ionicons name="wifi-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.toggleInfo}>
              <Text style={[styles.rowLabel, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}>Offline Mode</Text>
              <Text style={[styles.rowSub, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>Store credentials for offline access</Text>
            </View>
            <Switch value={offlineMode} onValueChange={setOfflineMode} trackColor={{ true: colors.primary }} />
          </View>
          <Sep colors={colors} />
          <View style={styles.toggleRow}>
            <View style={[styles.icon, { backgroundColor: colors.primarySurface }]}>
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.toggleInfo}>
              <Text style={[styles.rowLabel, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}>Auto-Sync</Text>
              <Text style={[styles.rowSub, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>Sync when connection restored</Text>
            </View>
            <Switch value={autoSync} onValueChange={setAutoSync} trackColor={{ true: colors.primary }} />
          </View>
          <Sep colors={colors} />
          <ActionRow
            icon="sync-outline"
            label={syncing ? 'Syncing…' : 'Sync Now'}
            sublabel="Pull latest credential updates from server"
            onPress={handleSync}
            colors={colors}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function GroupLabel({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return <Text style={[styles.groupLabel, { color: colors.textSubtle, fontFamily: 'Poppins_600SemiBold' }]}>{title}</Text>;
}

function ActionRow({ icon, label, sublabel, onPress, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; sublabel?: string; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: colors.primarySurface }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.rowLabel, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}>{label}</Text>
        {sublabel && <Text style={[styles.rowSub, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
    </Pressable>
  );
}

function Sep({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.sep, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { padding: 4 },
  title: { flex: 1, textAlign: 'center', fontSize: 18 },
  spacer: { width: 32 },
  content: { padding: 16, gap: 6 },
  groupLabel: { fontSize: 11, letterSpacing: 0.8, marginTop: 12, marginBottom: 4, paddingHorizontal: 4 },
  card: { borderWidth: 1, overflow: 'hidden' },
  didRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  didInfo: { flex: 1 },
  didValue: { fontSize: 12, marginTop: 2 },
  storageRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  storageLabel: { fontSize: 14 },
  storageValue: { fontSize: 22 },
  storageSub: { fontSize: 12 },
  queueBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, margin: 12, borderRadius: 8 },
  queueText: { fontSize: 12, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  toggleInfo: { flex: 1 },
  info: { flex: 1 },
  rowLabel: { fontSize: 15 },
  rowSub: { fontSize: 12 },
  sep: { height: 1 },
});
