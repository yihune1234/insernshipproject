import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { presentationApi } from '@/services/presentation';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useCredentials } from '@/contexts/CredentialsContext';
import { useColors } from '@/hooks/useColors';
import { getTopPadding } from '@/utils/layout';

const DEMO_VERIFIER_DID = 'did:example:verifier-demo';
const DEMO_VERIFIER_NAME = 'Commercial Bank of Ethiopia';
const DEMO_CREDENTIAL_TYPE = 'Degree Credential';

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addActivity } = useActivities();
  const { credentials } = useCredentials();
  const [scanning, setScanning] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const scanLineY = useSharedValue(0);
  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const startScan = () => {
    setVerifyError(null);
    setScanning(true);
    scanLineY.value = withRepeat(withTiming(200, { duration: 1600 }), -1, true);
    setTimeout(() => {
      setScanning(false);
      setShowRequest(true);
    }, 2000);
  };

  const handleAllow = async () => {
    setShowRequest(false);
    setVerifying(true);
    setVerifyError(null);
    try {
      const activeCredential = credentials.find(
        (c: any) => String(c.status).toUpperCase() === 'ACTIVE',
      ) ?? credentials[0];

      if (activeCredential) {
        await presentationApi.generateHolderPresentation({
          credential_ids: [String(activeCredential.id)],
          verifier_did: DEMO_VERIFIER_DID,
          requested_claims: [],
        }).catch(() => null);
      }

      addActivity({
        action: 'Credential Verified',
        actionType: 'CREDENTIAL_VERIFIED',
        timestamp: new Date().toISOString(),
        details: `Shared with ${DEMO_VERIFIER_NAME} via QR scan`,
      });
      router.push('/verification-result');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setVerifyError(msg);
      Alert.alert('Verification Failed', msg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A1510' }]}>
      {/* Camera Mock */}
      <View style={styles.cameraArea}>
        <View style={[styles.cameraBg, { backgroundColor: '#0D1B12' }]}>
          <View style={styles.scanFrame}>
            {/* Corner brackets */}
            {[
              { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
              { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
              { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
              { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
            ].map((style, i) => (
              <View key={i} style={[styles.corner, style, { borderColor: colors.primaryLight }]} />
            ))}

            {scanning ? (
              <Animated.View style={[styles.scanLine, { backgroundColor: colors.primary }, scanStyle]} />
            ) : (
              <View style={styles.scanPrompt}>
                <Ionicons name="qr-code-outline" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={[styles.scanPromptText, { fontFamily: 'Poppins_400Regular' }]}>
                  {verifying ? 'Verifying…' : 'Point camera at QR code'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Header overlay */}
      <View style={[styles.headerOverlay, { paddingTop: getTopPadding(insets) + 16 }]}>
        <Text style={[styles.headerTitle, { fontFamily: 'Poppins_600SemiBold' }]}>Scan QR Code</Text>
        <Pressable style={styles.flashBtn}>
          <Ionicons name="flash-outline" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 80 }]}>
        <Text style={[styles.hint, { fontFamily: 'Poppins_400Regular' }]}>
          Align QR code within the frame
        </Text>
        {verifying ? (
          <View style={styles.verifyingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.verifyingText, { color: colors.primaryLight, fontFamily: 'Poppins_500Medium' }]}>
              Verifying credential…
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={startScan}
            disabled={scanning}
            style={({ pressed }) => [
              styles.scanBtn,
              { backgroundColor: colors.primary, opacity: pressed || scanning ? 0.7 : 1 },
            ]}
          >
            {scanning ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="scan" size={22} color="#FFFFFF" />
                <Text style={[styles.scanBtnText, { fontFamily: 'Poppins_600SemiBold' }]}>
                  Scan QR Code
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Credential Request Modal */}
      <Modal visible={showRequest} transparent animationType="slide">
        <Pressable style={styles.modalBg} onPress={() => setShowRequest(false)}>
          <View style={[styles.requestSheet, { backgroundColor: colors.card, borderRadius: colors.radius + 8 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.requestTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
              Credential Request
            </Text>
            <View style={[styles.requestCard, { backgroundColor: colors.backgroundAlt, borderRadius: colors.radius }]}>
              <Ionicons name="business-outline" size={22} color={colors.primary} />
              <View>
                <Text style={[styles.requestOrg, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                  {DEMO_VERIFIER_NAME}
                </Text>
                <Text style={[styles.requestDetail, { color: colors.textMuted, fontFamily: 'Poppins_400Regular' }]}>
                  Requests: {DEMO_CREDENTIAL_TYPE}
                </Text>
              </View>
            </View>
            <Text style={[styles.consentNote, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
              This share will be recorded in your Activity log.
            </Text>
            <View style={styles.requestButtons}>
              <Button label="Deny" onPress={() => setShowRequest(false)} variant="outline" fullWidth={false} />
              <View style={{ flex: 1 }}>
                <Button label="Allow" onPress={handleAllow} />
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cameraArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  scanFrame: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: { position: 'absolute', width: 30, height: 30 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, opacity: 0.8 },
  scanPrompt: { alignItems: 'center', gap: 12 },
  scanPromptText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, flex: 1, textAlign: 'center' },
  flashBtn: { position: 'absolute', right: 24, bottom: 16, padding: 8 },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
  },
  scanBtnText: { color: '#FFFFFF', fontSize: 16 },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verifyingText: { fontSize: 16 },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  requestSheet: {
    padding: 24,
    gap: 16,
    margin: 16,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  requestTitle: { fontSize: 20 },
  requestCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  requestOrg: { fontSize: 15 },
  requestDetail: { fontSize: 13 },
  consentNote: { fontSize: 12, lineHeight: 18 },
  requestButtons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
});
