import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '@/contexts/PreferencesContext';
import { useColors } from '@/hooks/useColors';
import { getTopPadding } from '@/utils/layout';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om', name: 'Afaan Oromo', native: 'Afaan Oromo', flag: '🇪🇹' },
  { code: 'ti', name: 'Tigrinya', native: 'ትግርኛ', flag: '🇪🇹' },
  { code: 'so', name: 'Somali', native: 'Soomaali', flag: '🇸🇴' },
];

export default function LanguageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = usePreferences();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
      <View style={[styles.header, { paddingTop: getTopPadding(insets) + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Language</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={[styles.hint, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
          Choose the language for the Debo Wallet interface.
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {LANGUAGES.map((lang, i) => {
            const selected = language === lang.code;
            return (
              <View key={lang.code}>
                <Pressable
                  onPress={() => { setLanguage(lang.code); router.back(); }}
                  style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <View style={styles.info}>
                    <Text style={[styles.langName, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>{lang.name}</Text>
                    <Text style={[styles.langNative, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>{lang.native}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                {i < LANGUAGES.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
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
  content: { padding: 16, gap: 12 },
  hint: { fontSize: 14, lineHeight: 22 },
  card: { borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  flag: { fontSize: 24 },
  info: { flex: 1 },
  langName: { fontSize: 15 },
  langNative: { fontSize: 13 },
  sep: { height: 1 },
});
