import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { SafeScreen } from '@/components/shared/SafeScreen';
import { Stepper } from '@/components/ui/Stepper';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { credentialApi } from '@/services/credentials/credentialApi';
import type { OrganizationType, OrganizationSummary } from '@/services/api/types';

// ── Types ────────────────────────────────────────────────────────────────────
interface CredTypeItem { id: string; name: string; description?: string; options?: { id: string; name: string; code?: string }[] }
interface CatalogOrgType {
  id: string; name: string; description?: string;
  organizations?: { id: string; name: string; credential_types?: CredTypeItem[] }[];
}

type Step = 'orgType' | 'org' | 'credType' | 'review';
const STEP_LABELS: Record<Step, string> = { orgType: 'Category', org: 'Organization', credType: 'Credential', review: 'Review' };
const STEPS: Step[] = ['orgType', 'org', 'credType', 'review'];

const SECTOR_ICONS: Record<string, string> = {
  education: 'school-outline', government: 'business-outline', health: 'medkit-outline',
  professional: 'ribbon-outline', employment: 'briefcase-outline', finance: 'cash-outline',
};
const SECTOR_COLORS: Record<string, string> = {
  education: '#1B6B3A', government: '#C8991A', health: '#C0392B',
  professional: '#7B3FA0', employment: '#B45309', finance: '#1A6FAA',
};

export default function RequestCredentialScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('orgType');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Catalog data
  const [catalogOrgTypes, setCatalogOrgTypes] = useState<CatalogOrgType[]>([]);
  const [orgTypes, setOrgTypes] = useState<OrganizationType[]>([]);
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([]);
  const [credTypes, setCredTypes] = useState<CredTypeItem[]>([]);

  // Selections
  const [selOrgType, setSelOrgType] = useState<{ id: string; name: string } | null>(null);
  const [selOrg, setSelOrg] = useState<{ id: string; name: string } | null>(null);
  const [selCredType, setSelCredType] = useState<CredTypeItem | null>(null);
  const [selOption, setSelOption] = useState<{ id: string; name: string } | null>(null);
  const [notes, setNotes] = useState('');

  // ── Load catalog on mount ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const catalog = await credentialApi.getRequestCatalog();
        if (catalog?.organization_types?.length) {
          setCatalogOrgTypes(catalog.organization_types as CatalogOrgType[]);
        } else {
          const types = await credentialApi.listOrganizationTypes();
          setOrgTypes(types);
        }
      } catch { setError('Could not load catalog. Check your connection.'); }
      setLoading(false);
    })();
  }, []);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const stepIndex = STEPS.indexOf(step);

  const goBack = () => {
    if (stepIndex > 0) { setStep(STEPS[stepIndex - 1]); setError(''); }
    else router.back();
  };

  const selectOrgType = useCallback(async (ot: { id: string; name: string }) => {
    setSelOrgType(ot); setSelOrg(null); setSelCredType(null); setSelOption(null);
    const catalogEntry = catalogOrgTypes.find(c => c.id === ot.id);
    if (catalogEntry?.organizations?.length) {
      setOrgs(catalogEntry.organizations as unknown as OrganizationSummary[]);
    } else {
      setLoading(true);
      const list = await credentialApi.listOrganizations(ot.id).catch(() => []);
      setOrgs(list);
      setLoading(false);
    }
    setStep('org');
  }, [catalogOrgTypes]);

  const selectOrg = useCallback(async (o: { id: string; name: string }) => {
    setSelOrg(o); setSelCredType(null); setSelOption(null);
    const catalogEntry = catalogOrgTypes.find(c => c.id === selOrgType?.id);
    const catalogOrg = catalogEntry?.organizations?.find(co => co.id === o.id);
    if (catalogOrg?.credential_types?.length) {
      setCredTypes(catalogOrg.credential_types);
    } else {
      setLoading(true);
      const types = await credentialApi.listCredentialTypes(selOrgType?.name).catch(() => []);
      setCredTypes(types as CredTypeItem[]);
      setLoading(false);
    }
    setStep('credType');
  }, [catalogOrgTypes, selOrgType]);

  const selectCredType = (ct: CredTypeItem) => {
    setSelCredType(ct); setSelOption(null); setStep('review');
  };

  const submit = async () => {
    if (!selOrg || !selCredType) return;
    setSubmitting(true); setError('');
    try {
      await credentialApi.createCredentialRequest({
        organization_id: selOrg.id,
        credential_type_id: selCredType.id,
        additional_claims: notes ? { notes, credential_option_id: selOption?.id } : {},
      });
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
    }
    setSubmitting(false);
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const orgTypeList = catalogOrgTypes.length ? catalogOrgTypes : orgTypes;

  const renderStepper = () => (
    <Stepper current={stepIndex + 1} total={STEPS.length} labels={STEPS.map(s => STEP_LABELS[s])} />
  );

  const renderCard = (item: { id: string; name: string; description?: string | null }, onPress: () => void, iconName?: string, accentColor?: string) => (
    <Pressable key={item.id} onPress={onPress} style={({ pressed }) => [s.optionCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[s.optionIcon, { backgroundColor: (accentColor ?? colors.primary) + '18' }]}>
        <Ionicons name={(iconName ?? 'folder-outline') as any} size={24} color={accentColor ?? colors.primary} />
      </View>
      <View style={s.optionInfo}>
        <Text style={[s.optionName, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>{item.name}</Text>
        {item.description ? <Text style={[s.optionDesc, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]} numberOfLines={2}>{item.description}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeScreen style={{ backgroundColor: colors.background }}>
        <LinearGradient colors={[colors.primary, colors.primaryLight]} style={[s.successGrad, { paddingTop: 40 }]}>
          <View style={s.successIcon}><Ionicons name="checkmark-circle" size={72} color="#FFF" /></View>
          <Text style={[s.successTitle, { fontFamily: 'Poppins_700Bold' }]}>Request Submitted!</Text>
          <Text style={[s.successSub, { fontFamily: 'Poppins_400Regular' }]}>
            Your credential request has been sent to {selOrg?.name}. You'll be notified when it's ready.
          </Text>
          <View style={s.successActions}>
            <Button label="Back to Home" onPress={() => router.replace('/(tabs)')} />
            <Pressable onPress={() => router.replace('/(tabs)/credentials')} style={s.successLink}>
              <Text style={[s.successLinkText, { fontFamily: 'Poppins_500Medium' }]}>View My Credentials</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={{ backgroundColor: colors.backgroundAlt }}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={[s.header, { paddingTop: 12 }]}>
        <View style={s.headerRow}>
          <Pressable onPress={goBack} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#FFF" /></Pressable>
          <Text style={[s.headerTitle, { fontFamily: 'Poppins_700Bold' }]}>Request Credential</Text>
          <View style={{ width: 32 }} />
        </View>
        {renderStepper()}
      </LinearGradient>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={[s.loadText, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>Loading…</Text></View>
      ) : (
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
          {error ? (
            <View style={[s.errorBanner, { backgroundColor: colors.errorSurface, borderRadius: colors.radius }]}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={[s.errorText, { color: colors.error, fontFamily: 'Poppins_400Regular' }]}>{error}</Text>
            </View>
          ) : null}

          {/* Step 1: Organization Type */}
          {step === 'orgType' && (
            <>
              <Text style={[s.stepTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Select Category</Text>
              <Text style={[s.stepSub, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>Choose the type of organization that issues the credential you need.</Text>
              {orgTypeList.map(ot => {
                const key = ot.name.toLowerCase();
                return renderCard(ot, () => selectOrgType(ot), SECTOR_ICONS[key] ?? 'grid-outline', SECTOR_COLORS[key]);
              })}
              {orgTypeList.length === 0 && <Text style={[s.emptyText, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>No organization types available.</Text>}
            </>
          )}

          {/* Step 2: Organization */}
          {step === 'org' && (
            <>
              <View style={s.breadcrumb}>
                <Pressable onPress={() => setStep('orgType')}><Text style={[s.breadLink, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>{selOrgType?.name}</Text></Pressable>
                <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
              </View>
              <Text style={[s.stepTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Select Organization</Text>
              <Text style={[s.stepSub, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>Choose the issuing organization.</Text>
              {orgs.map(o => renderCard(o, () => selectOrg(o), 'business-outline'))}
              {orgs.length === 0 && <Text style={[s.emptyText, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>No organizations found for this category.</Text>}
            </>
          )}

          {/* Step 3: Credential Type */}
          {step === 'credType' && (
            <>
              <View style={s.breadcrumb}>
                <Pressable onPress={() => setStep('orgType')}><Text style={[s.breadLink, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>{selOrgType?.name}</Text></Pressable>
                <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
                <Pressable onPress={() => setStep('org')}><Text style={[s.breadLink, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>{selOrg?.name}</Text></Pressable>
                <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
              </View>
              <Text style={[s.stepTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Select Credential</Text>
              <Text style={[s.stepSub, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>Choose the credential type you'd like to request.</Text>
              {credTypes.map(ct => renderCard(ct, () => selectCredType(ct), 'document-text-outline'))}
              {credTypes.length === 0 && <Text style={[s.emptyText, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>No credential types available.</Text>}
            </>
          )}

          {/* Step 4: Review & Submit */}
          {step === 'review' && (
            <>
              <Text style={[s.stepTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>Review & Submit</Text>
              <Text style={[s.stepSub, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>Confirm the details of your credential request.</Text>

              <View style={[s.reviewCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                {[{ label: 'Category', value: selOrgType?.name }, { label: 'Organization', value: selOrg?.name }, { label: 'Credential', value: selCredType?.name }].map((r, i) => (
                  <View key={r.label} style={[s.reviewRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <Text style={[s.reviewLabel, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>{r.label}</Text>
                    <Text style={[s.reviewValue, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>{r.value}</Text>
                  </View>
                ))}
              </View>

              {/* Options */}
              {selCredType?.options && selCredType.options.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[s.optLabel, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>Select Option</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {selCredType.options.map(op => (
                      <Pressable key={op.id} onPress={() => setSelOption(selOption?.id === op.id ? null : op)}
                        style={[s.optChip, { backgroundColor: selOption?.id === op.id ? colors.primary : colors.card, borderColor: selOption?.id === op.id ? colors.primary : colors.border, borderRadius: 20 }]}>
                        <Text style={[s.optChipText, { color: selOption?.id === op.id ? '#FFF' : colors.text, fontFamily: 'Poppins_500Medium' }]}>{op.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Notes */}
              <View style={{ marginTop: 16 }}>
                <Text style={[s.optLabel, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>Additional Notes (optional)</Text>
                <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={3} placeholder="Any additional information…"
                  placeholderTextColor={colors.textSubtle}
                  style={[s.notesInput, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, color: colors.text, fontFamily: 'Poppins_400Regular' }]} />
              </View>

              <View style={{ marginTop: 24 }}>
                <Button label="Submit Request" onPress={submit} loading={submitting} />
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeScreen>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, color: '#FFF' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 10, marginLeft: 4 },
  stepLine: { width: 24, height: 2, marginHorizontal: 4, borderRadius: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadText: { fontSize: 14 },
  content: { padding: 20, gap: 12 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  errorText: { flex: 1, fontSize: 13 },
  stepTitle: { fontSize: 22, marginTop: 4 },
  stepSub: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  breadLink: { fontSize: 13 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, gap: 14, marginBottom: 2 },
  optionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  optionInfo: { flex: 1, gap: 2 },
  optionName: { fontSize: 15 },
  optionDesc: { fontSize: 12, lineHeight: 16 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 40 },
  reviewCard: { borderWidth: 1, overflow: 'hidden' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  reviewLabel: { fontSize: 13 },
  reviewValue: { fontSize: 14, flexShrink: 1, textAlign: 'right', maxWidth: '60%' },
  optLabel: { fontSize: 14 },
  optChip: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, marginRight: 8 },
  optChipText: { fontSize: 13 },
  notesInput: { borderWidth: 1, padding: 14, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginTop: 8 },
  successGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIcon: { marginBottom: 20 },
  successTitle: { fontSize: 26, color: '#FFF', textAlign: 'center', marginBottom: 10 },
  successSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  successActions: { marginTop: 32, width: '100%', gap: 16 },
  successLink: { alignItems: 'center', padding: 8 },
  successLinkText: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
});
