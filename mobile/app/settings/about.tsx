import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { getTopPadding } from '@/utils/layout';

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const links = [
    { icon: 'document-text-outline' as const, label: 'Terms of Service', onPress: () => {} },
    { icon: 'shield-outline' as const, label: 'Privacy Policy', onPress: () => {} },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', onPress: () => {} },
    { icon: 'call-outline' as const, label: 'Contact NDICA', onPress: () => {} },
    { icon: 'bug-outline' as const, label: 'Report a Bug', onPress: () => {} },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundAlt }]}>
      <View style={[styles.header, { paddingTop: getTopPadding(insets) + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>About</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* App identity */}
        <View style={styles.identity}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primarySurface, borderRadius: 20 }]}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} contentFit="contain" />
          </View>
          <Text style={[styles.appName, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Debo Wallet</Text>
          <Text style={[styles.appVersion, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>Version 1.0.0 (Build 100)</Text>
          <View style={[styles.badge, { backgroundColor: colors.primarySurface, borderRadius: 20 }]}>
            <Text style={[styles.badgeText, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
              National Digital Credential Wallet
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.desc, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
            Debo Wallet is the official Holder Wallet of the National Digital Credential Ecosystem (NDCE) of the Federal Democratic Republic of Ethiopia. It enables citizens to securely store, manage, and share their digital credentials.
          </Text>
        </View>

        {/* Authority */}
        <View style={[styles.authorityCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.authorityRow}>
            <View style={[styles.govIcon, { backgroundColor: colors.goldLight, borderRadius: 10 }]}>
              <Text style={styles.govEmoji}>🇪🇹</Text>
            </View>
            <View>
              <Text style={[styles.authorityTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                National Digital Identity & Credentials Authority
              </Text>
              <Text style={[styles.authoritySub, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
                Federal Democratic Republic of Ethiopia
              </Text>
            </View>
          </View>
        </View>

        {/* Links */}
        <View style={[styles.linksCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {links.map((link, i) => (
            <View key={link.label}>
              <Pressable onPress={link.onPress} style={({ pressed }) => [styles.link, { opacity: pressed ? 0.7 : 1 }]}>
                <View style={[styles.linkIcon, { backgroundColor: colors.primarySurface }]}>
                  <Ionicons name={link.icon} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.linkLabel, { color: colors.text, fontFamily: 'Poppins_400Regular', flex: 1 }]}>{link.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
              </Pressable>
              {i < links.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        {/* Copyright */}
        <Text style={[styles.copyright, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
          © 2026 NDICA · Federal Democratic Republic of Ethiopia{'\n'}All rights reserved. Document ID: NDCE-MOBILE-HOLDER-001
        </Text>
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
  content: { padding: 16, gap: 14 },
  identity: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  logoWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: 64, height: 64 },
  appName: { fontSize: 24 },
  appVersion: { fontSize: 13 },
  badge: { paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontSize: 12 },
  descCard: { borderWidth: 1, padding: 16 },
  desc: { fontSize: 14, lineHeight: 22 },
  authorityCard: { borderWidth: 1, padding: 16 },
  authorityRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  govIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  govEmoji: { fontSize: 24 },
  authorityTitle: { fontSize: 14 },
  authoritySub: { fontSize: 12 },
  linksCard: { borderWidth: 1, overflow: 'hidden' },
  link: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  linkIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 15 },
  sep: { height: 1 },
  copyright: { fontSize: 11, textAlign: 'center', lineHeight: 18 },
});
