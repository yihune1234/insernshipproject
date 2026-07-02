import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { formatDate } from '@/utils/date';

export default function IdentityConfirmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pendingCitizen } = useAuth();

  useEffect(() => {
    if (!pendingCitizen) {
      router.replace('/(auth)/national-id');
    }
  }, [pendingCitizen]);

  if (!pendingCitizen) {
    return null;
  }

  const fields = [
    { label: 'Full Name', value: pendingCitizen.fullName },
    { label: 'National ID', value: pendingCitizen.nationalId },
    { label: 'Date of Birth', value: formatDate(pendingCitizen.dob) },
    { label: 'Gender', value: pendingCitizen.gender },
    { label: 'Region', value: pendingCitizen.region },
    { label: 'City', value: pendingCitizen.city },
    { label: 'Phone', value: pendingCitizen.phone },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 40 : 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Stepper current={3} total={5} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
          Confirm Your Identity
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
          Please verify this information matches your official documents.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.avatarRow}>
            <Image
              source={{ uri: pendingCitizen.photo }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View>
              <Text style={[styles.name, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
                {pendingCitizen.fullName}
              </Text>
              <Text style={[styles.did, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
                {pendingCitizen.did.slice(0, 32)}…
              </Text>
              <View style={[styles.verifiedBadge, { backgroundColor: colors.successSurface }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={[styles.verifiedText, { color: colors.success, fontFamily: 'Poppins_500Medium' }]}>
                  NIDA Verified
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {fields.map((f) => (
            <View key={f.label} style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
                {f.label}
              </Text>
              <Text style={[styles.fieldValue, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>
                {f.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.notice, { backgroundColor: colors.warningSurface, borderRadius: colors.radius }]}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={[styles.noticeText, { color: colors.warning, fontFamily: 'Poppins_400Regular' }]}>
            If any information is incorrect, contact your nearest NIDA office.
          </Text>
        </View>

        <View style={styles.buttons}>
          <Button label="Yes, This Is Me" onPress={() => router.push('/(auth)/pin-create')} />
          <Button
            label="Not Me"
            onPress={() => router.replace('/(auth)/national-id')}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  back: { padding: 4 },
  step: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  stepText: { fontSize: 12 },
  content: { padding: 24, gap: 16, paddingBottom: 40 },
  title: { fontSize: 24 },
  subtitle: { fontSize: 14, lineHeight: 22 },
  card: { borderWidth: 1, padding: 20, gap: 12 },
  avatarRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  name: { fontSize: 18 },
  did: { fontSize: 10, marginTop: 2 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  verifiedText: { fontSize: 10 },
  divider: { height: 1 },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fieldLabel: { fontSize: 12 },
  fieldValue: { fontSize: 14 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
  },
  noticeText: { fontSize: 12, flex: 1, lineHeight: 18 },
  buttons: { gap: 10 },
});
