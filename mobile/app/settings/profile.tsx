import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useCredentials } from '@/contexts/CredentialsContext';
import { useColors } from '@/hooks/useColors';
import { formatDate } from '@/utils/date';
import { getTopPadding } from '@/utils/layout';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { citizen } = useAuth();
  const { credentials } = useCredentials();

  if (!citizen) return null;

  const fields = [
    { label: 'Full Name', value: citizen.fullName },
    { label: 'National ID', value: citizen.nationalId },
    { label: 'Wallet DID', value: citizen.did, copyable: true },
    { label: 'Phone', value: citizen.phone.slice(0, 4) + '****' + citizen.phone.slice(-2) },
    { label: 'Email', value: citizen.email.replace(/(.{3}).+(@.+)/, '$1****$2') },
    { label: 'Region', value: citizen.region },
    { label: 'Date of Birth', value: formatDate(citizen.dob) },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
      <View style={[styles.header, { paddingTop: getTopPadding(insets) + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Profile</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Image source={{ uri: citizen.photo }} style={styles.avatar} contentFit="cover" />
          <Text style={[styles.name, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>{citizen.fullName}</Text>
          <Text style={[styles.id, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>{citizen.nationalId}</Text>
        </View>

        {/* Fields */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {fields.map((f, i) => (
            <View key={f.label}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>{f.label}</Text>
                <View style={styles.fieldRight}>
                  <Text style={[styles.fieldValue, { color: colors.text, fontFamily: 'Poppins_500Medium' }]} numberOfLines={1}>
                    {f.value}
                  </Text>
                  {f.copyable && <Ionicons name="copy-outline" size={14} color={colors.primary} />}
                </View>
              </View>
              {i < fields.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        {/* NIDA Section */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSubtle, fontFamily: 'Poppins_600SemiBold' }]}>
            NIDA VERIFICATION
          </Text>
          <View style={styles.nidaRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <View>
              <Text style={[styles.nidaTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                Identity verified by NIDA
              </Text>
              <Text style={[styles.nidaSub, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
                National ID Authority of Ethiopia
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet Status */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSubtle, fontFamily: 'Poppins_600SemiBold' }]}>
            WALLET STATUS
          </Text>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>Wallet Address</Text>
            <Text style={[styles.fieldValue, { color: colors.text, fontFamily: 'Poppins_500Medium' }]} numberOfLines={1}>
              {citizen.walletAddress}
            </Text>
          </View>
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>Status</Text>
            <View style={styles.activeStatus}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.fieldValue, { color: colors.success, fontFamily: 'Poppins_600SemiBold' }]}>Active</Text>
            </View>
          </View>
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>Credentials</Text>
            <Text style={[styles.fieldValue, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>{credentials.length} total</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { padding: 4 },
  headerTitle: { fontSize: 20 },
  spacer: { width: 32 },
  content: { padding: 16, gap: 14 },
  avatarSection: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  name: { fontSize: 22 },
  id: { fontSize: 14 },
  card: { borderWidth: 1, overflow: 'hidden' },
  field: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  fieldLabel: { fontSize: 13, flex: 1 },
  fieldRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1.5, justifyContent: 'flex-end' },
  fieldValue: { fontSize: 14, flex: 1, textAlign: 'right' },
  sep: { height: 1 },
  sectionTitle: { fontSize: 11, letterSpacing: 0.8, paddingHorizontal: 16, paddingVertical: 10 },
  nidaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingBottom: 14 },
  nidaTitle: { fontSize: 14 },
  nidaSub: { fontSize: 12 },
  activeStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
});
