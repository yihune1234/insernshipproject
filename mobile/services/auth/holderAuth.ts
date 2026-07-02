import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authApi } from './authApi';
import * as LocalAuth from './localAuth';
import { ApiClient } from '../api/client';
import { getApiConfig } from '../api/config';

const KEYS = {
  USER: 'user',
  DID: 'did',
  WALLET: 'wallet',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  DEVICE_ID: 'device_id',
  IS_REGISTERED: 'is_registered',
  NATIONAL_ID: 'national_id',
};

export interface HolderUser {
  id: string; national_id?: string; name: string; full_name?: string;
  role: string; national_id_verified: boolean;
  phone?: string; photo?: string;
}

export interface HolderWallet { id: string; name: string; }

export interface RegistrationData {
  user: HolderUser; wallet: HolderWallet; did: string; deviceId: string; publicKey: string;
}

// ── Status helpers ───────────────────────────────────────────────────────────

export async function isRegistered(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.IS_REGISTERED)) === 'true';
}

export async function isLocalAuthSetup(): Promise<boolean> {
  return LocalAuth.isLocalAuthSetup();
}

export async function getAuthStatus() {
  const [registered, hasLocalAuth, user, did] = await Promise.all([
    isRegistered(), LocalAuth.isLocalAuthSetup(),
    getStoredUser(), getStoredDID(),
  ]);
  return { isRegistered: registered, hasLocalAuth, isReady: registered && hasLocalAuth, user, did };
}

// ── Registration ────────────────────────────────────────────────────────────

export async function register(
  name: string, email: string, password: string, phone?: string, role = 'holder',
): Promise<RegistrationData> {
  const deviceId = await getDeviceId();
  const { publicKey, privateKey } = await generateKeyPair();

  const response = await authApi.register({ name, email, password, phone, role });
  await saveRegistrationData({
    user_id: response.data.user_id,
    tokens: { access: '', refresh: '' },
    deviceId,
    privateKey,
  });
  return { user: { id: response.data.user_id, name, role, national_id_verified: false }, wallet: { id: '', name: '' }, did: '', deviceId, publicKey };
}

export async function verifyOTP(userId: string, otp: string) {
  const response = await authApi.verifyOTP(userId, otp);
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, response.data.tokens.access);
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, response.data.tokens.refresh);
  await AsyncStorage.multiSet([
    ['backup_access_token', response.data.tokens.access],
    ['backup_refresh_token', response.data.tokens.refresh],
    [KEYS.USER, JSON.stringify(response.data.user)],
    [KEYS.IS_REGISTERED, 'true'],
  ]);
  return response;
}

export async function login(email: string, password: string) {
  const response = await authApi.login(email, password);
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, response.data.tokens.access);
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, response.data.tokens.refresh);
  await AsyncStorage.multiSet([
    ['backup_access_token', response.data.tokens.access],
    ['backup_refresh_token', response.data.tokens.refresh],
    [KEYS.USER, JSON.stringify(response.data.user)],
    [KEYS.IS_REGISTERED, 'true'],
  ]);
  return response;
}

/**
 * ── Step 1: Request OTP using National ID ────────────────────────────────────
 * POST /api/national-id/initiate/
 * Sends the National ID to the backend which generates an OTP,
 * stores it in the Django cache, and logs it to the terminal.
 */
export async function requestOTP(nationalId: string): Promise<{
  success: boolean;
  masked_phone: string;
  account_exists: boolean;
  otp_for_testing?: string;
  session_id?: string;
}> {
  const client = new ApiClient(getApiConfig());
  const result = await client.post<Record<string, unknown>>('/national-id/initiate/', { fin: nationalId });
  return {
    success: true,
    masked_phone: String(result.masked_phone ?? '****'),
    account_exists: Boolean(result.account_exists ?? false),
    otp_for_testing: result.otp_for_testing ? String(result.otp_for_testing) : undefined,
    session_id: result.session_id ? String(result.session_id) : undefined,
  };
}

/**
 * ── Step 2: Confirm OTP and fetch citizen profile ────────────────────────────
 * POST /api/national-id/confirm/
 */
export async function confirmOTP(sessionId: string, otp: string): Promise<Record<string, unknown>> {
  const client = new ApiClient(getApiConfig());
  return client.post('/national-id/confirm/', { session_id: sessionId, otp });
}

/**
 * ── Register locally: store holder credentials on device only ───────────────
 * Creates a fully local registration without hitting any server endpoint.
 * Credentials, keys, and profile data are stored in SecureStore + AsyncStorage.
 * If online, also registers the holder on the backend using National ID so that
 * sync operations (credentials, wallet) can authenticate with the server.
 */
export async function registerLocally(
  nationalId: string,
  fullName: string,
  phone?: string,
  photo?: string,
): Promise<{ user: HolderUser; did: string; wallet: HolderWallet }> {
  const deviceId = await getDeviceId();
  const { publicKey, privateKey } = await generateKeyPair();
  const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const did = `did:et:citizen:${nationalId}`;

  const user: HolderUser = {
    id: localId,
    national_id: nationalId,
    name: fullName,
    full_name: fullName,
    role: 'holder',
    national_id_verified: true,
    phone: phone ?? '',
    photo: photo,
  };

  const wallet: HolderWallet = { id: `wallet-${localId}`, name: 'Debo Wallet' };

  // Persist everything locally (no server tokens stored)
  await SecureStore.setItemAsync('private_key', privateKey);
  await AsyncStorage.multiSet([
    [KEYS.USER, JSON.stringify(user)],
    [KEYS.IS_REGISTERED, 'true'],
    [KEYS.DID, did],
    [KEYS.NATIONAL_ID, nationalId],
    [KEYS.DEVICE_ID, deviceId],
  ]);

  // Try to register on server (for sync authentication) — non-blocking
  registerOnServer(nationalId, fullName, phone ?? '', deviceId, publicKey)
    .catch(() => {/* offline — will sync later */});

  return { user, did, wallet };
}

/**
 * Try to register on the backend server using National ID.
 * This allows the mobile holder to sync credentials when online.
 * Stores returned tokens for authenticated API calls.
 */
async function registerOnServer(
  nationalId: string,
  fullName: string,
  phone: string,
  deviceId: string,
  publicKey: string,
): Promise<void> {
  const client = new ApiClient(getApiConfig());
  try {
    const result = await client.post<Record<string, unknown>>('/wallet/register/', {
      national_id: nationalId,
      otp: '',          // Server accepts any OTP in dev mode
      phone,
      device_id: deviceId,
      public_key: publicKey,
    });

    const accessToken = String(result.access_token ?? '');
    const refreshToken = String(result.refresh_token ?? '');

    if (accessToken) {
      await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
    }
  } catch {
    // Server unreachable — will sync later when online
  }
}

/**
 * ── Reset PIN using OTP ──────────────────────────────────────────────────────
 */
export async function requestOTPForPINReset(nationalId: string): Promise<{ success: boolean; session_id?: string }> {
  const client = new ApiClient(getApiConfig());
  const result = await client.post<Record<string, unknown>>('/national-id/initiate/', { fin: nationalId, purpose: 'pin_reset' });
  return {
    success: true,
    session_id: result.session_id ? String(result.session_id) : undefined,
  };
}

export async function resetPINWithOTP(newPin: string, enableBiometric = false): Promise<void> {
  await setupLocalAuthentication(newPin, enableBiometric);
}

/**
 * ── Reset / Delete all local data ────────────────────────────────────────────
 */
export async function resetAllData(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN).catch(() => {});
  await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN).catch(() => {});
  await SecureStore.deleteItemAsync('private_key').catch(() => {});
  await AsyncStorage.multiRemove([
    'backup_access_token', 'backup_refresh_token',
    KEYS.USER, KEYS.WALLET, KEYS.DID, KEYS.DEVICE_ID, KEYS.IS_REGISTERED, KEYS.NATIONAL_ID,
  ]);
  await LocalAuth.clearLocalAuth();
}

// ── Step: Setup local auth ─────────────────────────────────────────────────

export async function setupLocalAuthentication(pin: string, enableBiometric = false): Promise<void> {
  await LocalAuth.setupPIN(pin);
  if (enableBiometric) {
    try { await LocalAuth.enableBiometric(pin); }
    catch (e) { /* non-critical */ }
  }
}

// ── App launch: authenticate locally ────────────────────────────────────────

export async function authenticateLocally(pin?: string, useBiometric = false): Promise<boolean> {
  const status = await LocalAuth.getLocalAuthStatus();
  if (!status.isSetup) throw new Error('Local authentication not set up');

  const onSuccess = () => {
    ensureAccessToken().catch(() => {});
    import('../sync/syncService')
      .then(m => m.syncData().catch(() => {}))
      .catch(() => {});
  };

  if (useBiometric && status.hasBiometric && status.biometricAvailable) {
    try {
      if (await LocalAuth.authenticateWithBiometric()) {
        onSuccess();
        return true;
      }
    } catch { if (!pin) return false; }
  }

  if (pin) {
    const ok = await LocalAuth.verifyPIN(pin);
    if (ok) onSuccess();
    return ok;
  }
  return false;
}

// ── Token management ─────────────────────────────────────────────────────────

export async function forceRefreshToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  if (!refreshToken) return null;
  if (refreshToken.startsWith('offline-')) return null;

  try {
    const response = await authApi.refreshToken(refreshToken);
    if (!response?.access) return null;

    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, response.access);
    return response.access;
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  } catch { return null; }
}

export async function ensureAccessToken(): Promise<void> {
  if (await getAccessToken()) return;

  const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  if (!refreshToken) {
    const registered = await AsyncStorage.getItem(KEYS.IS_REGISTERED);
    if (registered === 'true') return;
    throw new Error('SESSION_EXPIRED:Session expired. Please register again.');
  }

  try {
    const response = await authApi.refreshToken(refreshToken);
    if (response?.access) {
      await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, response.access);
    }
  } catch {
    // Network unavailable — app will work with cached data
  }
}

// ── Storage helpers ──────────────────────────────────────────────────────────

export async function getStoredUser(): Promise<HolderUser | null> {
  const json = await AsyncStorage.getItem(KEYS.USER);
  return json ? JSON.parse(json) : null;
}

export async function getStoredDID(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.DID);
}

export async function getStoredWallet(): Promise<HolderWallet | null> {
  const json = await AsyncStorage.getItem(KEYS.WALLET);
  return json ? JSON.parse(json) : null;
}

export async function getStoredDeviceId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.DEVICE_ID);
}

// ── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  try {
    const token = await getAccessToken();
    if (token) {
      const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
      if (refreshToken) authApi.logout(token, refreshToken).catch(() => {});
    }
  } catch { /* ignore */ }

  await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN).catch(() => {});
  await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN).catch(() => {});
  await SecureStore.deleteItemAsync('private_key').catch(() => {});
  await AsyncStorage.multiRemove([
    'backup_access_token', 'backup_refresh_token',
    KEYS.USER, KEYS.WALLET, KEYS.DID, KEYS.DEVICE_ID, KEYS.IS_REGISTERED, KEYS.NATIONAL_ID,
  ]);
  await LocalAuth.clearLocalAuth();
}

// ── Private helpers ──────────────────────────────────────────────────────────

async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(KEYS.DEVICE_ID);
  if (!id) {
    id = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(KEYS.DEVICE_ID, id);
  }
  return id;
}

async function getWebCryptoRandomBytes(length: number): Promise<Uint8Array> {
  const bytes = new Uint8Array(length);
  try {
    if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
  } catch {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

async function sha256Hex(input: string): Promise<string> {
  try {
    const { default: ExpoCrypto } = await import('expo-crypto');
    return await ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, input);
  } catch {
    const { sha256 } = await import('js-sha256');
    return sha256(input);
  }
}

async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  let privBytes: Uint8Array;
  try {
    const { default: ExpoCrypto } = await import('expo-crypto');
    privBytes = await ExpoCrypto.getRandomBytesAsync(32);
  } catch {
    privBytes = await getWebCryptoRandomBytes(32);
  }
  const privHex = Array.from(privBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const pubHex = await sha256Hex(privHex);
  return { publicKey: pubHex, privateKey: privHex };
}

async function saveRegistrationData(
  data: { user_id: string; tokens: { access: string; refresh: string }; deviceId: string; privateKey: string },
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync('private_key', data.privateKey),
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, data.tokens.access),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, data.tokens.refresh),
  ]);
  await AsyncStorage.setItem(KEYS.IS_REGISTERED, 'true');
  await AsyncStorage.setItem(KEYS.DEVICE_ID, data.deviceId);
}