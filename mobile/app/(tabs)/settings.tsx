import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SafeScreen } from '@/components/shared/SafeScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useCredentials } from '@/contexts/CredentialsContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useColors } from '@/hooks/useColors';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, label, value, onPress, danger = false }: SettingsRowProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.errorSurface : colors.primarySurface }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.error : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.error : colors.text, fontFamily: 'Poppins_400Regular' }]}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value && (
          <Text style={[styles.rowValue, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
            {value}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
      </View>
    </Pressable>
  );
}

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}

function SettingsGroup({ title, children, danger = false }: SettingsGroupProps) {
  const colors = useColors();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: danger ? colors.error : colors.textSubtle, fontFamily: 'Poppins_600SemiBold' }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.groupCard, { backgroundColor: danger ? colors.errorSurface : colors.card, borderColor: danger ? colors.error + '40' : colors.border, borderRadius: colors.radius }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { citizen, logout, deleteWallet } = useAuth();
  const { credentials } = useCredentials();
  const { language, theme } = usePreferences();

  const handleDeleteWallet = () => {
    Alert.alert(
      'Delete Wallet',
      'This will permanently remove your wallet and all local data. You cannot undo this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWallet();
            router.replace('/');
          },
        },
      ]
    );
  };

  const LANG_LABELS: Record<string, string> = { en: 'English', am: 'አማርኛ', om: 'Afaan Oromo', ti: 'ትግርኛ' };
  const THEME_LABELS: Record<string, string> = { light: 'Light', dark: 'Dark', system: 'System' };

  return (
    <SafeScreen style={{ backgroundColor: colors.backgroundAlt }}>
      <View style={[styles.header, { paddingTop: 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <Pressable
          onPress={() => router.push('/settings/profile')}
          style={({ pressed }) => [styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.9 : 1 }]}
        >
          <Image source={{ uri: citizen?.photo }} style={styles.profileAvatar} contentFit="cover" />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
              {citizen?.fullName}
            </Text>
            <Text style={[styles.profileId, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
              {citizen?.nationalId}
            </Text>
            <View style={styles.walletStatus}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={[styles.walletStatusText, { color: colors.success, fontFamily: 'Poppins_500Medium' }]}>
                Wallet Active · {credentials.length} credentials
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </Pressable>

        <SettingsGroup title="Account">
          <SettingsRow icon="person-outline" label="Profile" onPress={() => router.push('/settings/profile')} />
          <View style={[styles.rowSep, { backgroundColor: colors.border }]} />
          <SettingsRow icon="language-outline" label="Language" value={LANG_LABELS[language] ?? 'English'} onPress={() => router.push('/settings/language')} />
          <View style={[styles.rowSep, { backgroundColor: colors.border }]} />
          <SettingsRow icon="color-palette-outline" label="Appearance" value={THEME_LABELS[theme] ?? 'System'} onPress={() => router.push('/settings/appearance')} />
        </SettingsGroup>

        <SettingsGroup title="Security">
          <SettingsRow icon="lock-closed-outline" label="PIN & Biometric" onPress={() => router.push('/settings/security')} />
          <View style={[styles.rowSep, { backgroundColor: colors.border }]} />
          <SettingsRow icon="clipboard-outline" label="Session History" onPress={() => router.push('/settings/security')} />
          <View style={[styles.rowSep, { backgroundColor: colors.border }]} />
          <SettingsRow icon="key-outline" label="Key Information" onPress={() => {}} />
        </SettingsGroup>

        <SettingsGroup title="Wallet">
          <SettingsRow icon="save-outline" label="Backup Wallet" onPress={() => router.push('/settings/wallet-management')} />
          <View style={[styles.rowSep, { backgroundColor: colors.border }]} />
          <SettingsRow icon="cube-outline" label="Storage & Offline" onPress={() => router.push('/settings/wallet-management')} />
          <View style={[styles.rowSep, { backgroundColor: colors.border }]} />
          <SettingsRow icon="refresh-outline" label="Sync Status" value="2 min ago" onPress={() => {}} />
        </SettingsGroup>

        <SettingsGroup title="Privacy">
          <SettingsRow icon="shield-outline" label="Privacy & Consent" onPress={() => {}} />
          <View style={[styles.rowSep, { backgroundColor: colors.border }]} />
          <SettingsRow icon="business-outline" label="Connected Organizations" onPress={() => {}} />
        </SettingsGroup>

        <SettingsGroup title="About">
          <SettingsRow icon="information-circle-outline" label="About Debo Wallet" onPress={() => router.push('/settings/about')} />
          <View style={[styles.rowSep, { backgroundColor: colors.border }]} />
          <SettingsRow icon="document-text-outline" label="Terms of Service" onPress={() => router.push('/settings/about')} />
          <View style={[styles.rowSep, { backgroundColor: colors.border }]} />
          <SettingsRow icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/settings/about')} />
        </SettingsGroup>

        <SettingsGroup title="Account Actions">
          <SettingsRow
            icon="log-out-outline"
            label="Sign Out"
            onPress={async () => {
              await logout();
              router.replace('/');
            }}
            danger
          />
          <View style={[styles.rowSep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="trash-outline"
            label="Delete Wallet"
            onPress={handleDeleteWallet}
            danger
          />
        </SettingsGroup>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24 },
  content: { padding: 16, gap: 4 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 12,
  },
  profileAvatar: { width: 52, height: 52, borderRadius: 26 },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: 16 },
  profileId: { fontSize: 12 },
  walletStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  walletStatusText: { fontSize: 11 },
  group: { marginBottom: 4 },
  groupTitle: { fontSize: 11, marginBottom: 6, marginTop: 12, paddingHorizontal: 4, letterSpacing: 0.8 },
  groupCard: { borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 13 },
  rowSep: { height: 1, marginLeft: 64 },
});
