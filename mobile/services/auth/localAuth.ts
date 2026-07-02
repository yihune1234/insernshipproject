import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  PIN_HASH: 'local_pin_hash',
  PIN_SALT: 'local_pin_salt',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  LOCAL_AUTH_SETUP: 'local_auth_setup',
  FAILED_ATTEMPTS: 'failed_attempts',
  LOCKED_UNTIL: 'locked_until',
};

const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;

export interface LocalAuthStatus {
  isSetup: boolean; hasPIN: boolean; hasBiometric: boolean;
  biometricAvailable: boolean; isLocked: boolean;
  lockedUntil?: Date; failedAttempts: number;
}

export async function isLocalAuthSetup(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.LOCAL_AUTH_SETUP)) === 'true';
}

export async function getLocalAuthStatus(): Promise<LocalAuthStatus> {
  const [setup, bio, attemptsStr, lockedUntil] = await Promise.all([
    AsyncStorage.getItem(KEYS.LOCAL_AUTH_SETUP),
    AsyncStorage.getItem(KEYS.BIOMETRIC_ENABLED),
    AsyncStorage.getItem(KEYS.FAILED_ATTEMPTS),
    AsyncStorage.getItem(KEYS.LOCKED_UNTIL),
  ]);
  const pinHash = await SecureStore.getItemAsync(KEYS.PIN_HASH);
  const [hasHw, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return {
    isSetup: setup === 'true',
    hasPIN: !!pinHash,
    hasBiometric: bio === 'true',
    biometricAvailable: hasHw && isEnrolled,
    isLocked: lockedUntil ? new Date(lockedUntil) > new Date() : false,
    lockedUntil: lockedUntil ? new Date(lockedUntil) : undefined,
    failedAttempts: parseInt(attemptsStr ?? '0'),
  };
}

async function hashPIN(pin: string, salt: string): Promise<string> {
  return digestString(pin + salt);
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

async function getRandomBytes(length: number): Promise<Uint8Array> {
  try {
    const { default: ExpoCrypto } = await import('expo-crypto');
    return await ExpoCrypto.getRandomBytesAsync(length);
  } catch {
    return await getWebCryptoRandomBytes(length);
  }
}

async function digestString(data: string): Promise<string> {
  try {
    const { default: ExpoCrypto } = await import('expo-crypto');
    return await ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, data);
  } catch {
    // Fallback: use js-sha256 (pure JS, works everywhere)
    const { sha256 } = await import('js-sha256');
    return sha256(data);
  }
}

export async function setupPIN(pin: string): Promise<void> {
  if (!pin || pin.length < 4 || !/^\d+$/.test(pin))
    throw new Error('PIN must be at least 4 digits');
  const saltBytes = await getRandomBytes(16);
  const salt = btoa(String.fromCharCode(...saltBytes));
  const pinHash = await digestString(pin + salt);
  await SecureStore.setItemAsync(KEYS.PIN_HASH, pinHash);
  await SecureStore.setItemAsync(KEYS.PIN_SALT, salt);
  await AsyncStorage.setItem(KEYS.LOCAL_AUTH_SETUP, 'true');
  await AsyncStorage.multiRemove([KEYS.FAILED_ATTEMPTS, KEYS.LOCKED_UNTIL]);
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const status = await getLocalAuthStatus();
  if (status.isLocked) {
    const mins = Math.ceil((status.lockedUntil!.getTime() - Date.now()) / 60000);
    throw new Error(`Too many failed attempts. Try again in ${mins} minutes.`);
  }
  const [storedHash, salt] = await Promise.all([
    SecureStore.getItemAsync(KEYS.PIN_HASH),
    SecureStore.getItemAsync(KEYS.PIN_SALT),
  ]);
  if (!storedHash || !salt) throw new Error('PIN not set up');
  const valid = (await hashPIN(pin, salt)) === storedHash;
  if (valid) {
    await AsyncStorage.multiRemove([KEYS.FAILED_ATTEMPTS, KEYS.LOCKED_UNTIL]);
  } else {
    const attempts = status.failedAttempts + 1;
    await AsyncStorage.setItem(KEYS.FAILED_ATTEMPTS, String(attempts));
    if (attempts >= MAX_ATTEMPTS) {
      await AsyncStorage.setItem(KEYS.LOCKED_UNTIL, new Date(Date.now() + LOCK_MS).toISOString());
      throw new Error(`Account locked for ${LOCK_MS / 60000} minutes.`);
    }
  }
  return valid;
}

export async function enableBiometric(pin: string): Promise<void> {
  if (!(await verifyPIN(pin))) throw new Error('Invalid PIN');
  const [hasHw, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  if (!hasHw) throw new Error('Biometric hardware not available');
  if (!isEnrolled) throw new Error('No biometrics enrolled on device');
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable biometric' });
  if (!result.success) throw new Error('Biometric authentication failed');
  await AsyncStorage.setItem(KEYS.BIOMETRIC_ENABLED, 'true');
}

export async function disableBiometric(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.BIOMETRIC_ENABLED);
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const status = await getLocalAuthStatus();
  if (!status.hasBiometric || !status.biometricAvailable) return false;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access your wallet',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use PIN',
    });
    return result.success;
  } catch { return false; }
}

export async function changePIN(oldPIN: string, newPIN: string): Promise<void> {
  if (!(await verifyPIN(oldPIN))) throw new Error('Invalid current PIN');
  await setupPIN(newPIN);
}

export async function clearLocalAuth(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.PIN_HASH),
    SecureStore.deleteItemAsync(KEYS.PIN_SALT),
  ]);
  await AsyncStorage.multiRemove([
    KEYS.BIOMETRIC_ENABLED, KEYS.LOCAL_AUTH_SETUP,
    KEYS.FAILED_ATTEMPTS, KEYS.LOCKED_UNTIL,
  ]);
}

export async function isBiometricAvailable(): Promise<boolean> {
  const [hasHw, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHw && enrolled;
}
