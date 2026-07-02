import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '@/contexts/PreferencesContext';
import { useColors } from '@/hooks/useColors';
import { getTopPadding } from '@/utils/layout';

const THEMES = [
  { value: 'light', label: 'Light Mode', icon: 'sunny-outline' as const, description: 'Always use light appearance' },
  { value: 'dark', label: 'Dark Mode', icon: 'moon-outline' as const, description: 'Always use dark appearance' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' as const, description: 'Follow device setting' },
];

export default function AppearanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme, setTheme } = usePreferences();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
      <View style={[styles.header, { paddingTop: getTopPadding(insets) + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Appearance</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {THEMES.map((t, i) => {
            const selected = theme === t.value;
            return (
              <View key={t.value}>
                <Pressable
                  onPress={() => setTheme(t.value as 'light' | 'dark' | 'system')}
                  style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={[styles.icon, { backgroundColor: selected ? colors.primarySurface : colors.muted }]}>
                    <Ionicons name={t.icon} size={20} color={selected ? colors.primary : colors.textMuted} />
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.label, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>{t.label}</Text>
                    <Text style={[styles.desc, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>{t.description}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                {i < THEMES.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { padding: 4 },
  title: { flex: 1, textAlign: 'center', fontSize: 20 },
  spacer: { width: 32 },
  content: { padding: 16 },
  card: { borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: 15 },
  desc: { fontSize: 13 },
  sep: { height: 1 },
});
