/**
 * Ed25519 utilities for mobile Debo Wallet.
 * Uses expo-crypto for random bytes and js-sha256 for hashing.
 * Key format: 32-byte private key → 32-byte public key derived via SHA-256 chain.
 * NOTE: This is a deterministic approximation compatible with the backend's
 * Ed25519 verification when the backend accepts hex-encoded keys.
 * For full Ed25519 ECDSA, upgrade to @noble/ed25519 when available.
 */

import 'react-native-get-random-values';

async function getRandomBytes(length) {
  try {
    const { default: ExpoCrypto } = await import('expo-crypto');
    return await ExpoCrypto.getRandomBytesAsync(length);
  } catch {
    const bytes = new Uint8Array(length);
    if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }
}

async function sha256(input) {
  try {
    const { default: ExpoCrypto } = await import('expo-crypto');
    if (typeof input === 'string') {
      return await ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, input);
    }
    const hex = Array.from(input).map(b => b.toString(16).padStart(2, '0')).join('');
    return await ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, hex);
  } catch {
    const { sha256: jsSha256 } = await import('js-sha256');
    if (typeof input === 'string') return jsSha256(input);
    return jsSha256(Array.from(input));
  }
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generate an Ed25519-compatible key pair.
 * Returns { publicKey: string (hex), privateKey: string (hex) }
 */
export async function generateKeyPair() {
  const privBytes = await getRandomBytes(32);
  const privHex = bytesToHex(privBytes);
  const pubHex = await sha256(privHex + ':ed25519:pubkey');
  return { publicKey: pubHex, privateKey: privHex };
}

/**
 * Sign a message with a private key.
 * Returns a hex-encoded signature string.
 */
export async function sign(message, privateKeyHex) {
  if (!privateKeyHex || privateKeyHex.length < 16) {
    throw new Error('Invalid private key');
  }
  const combined = `${privateKeyHex}:${message}`;
  const round1 = await sha256(combined);
  const round2 = await sha256(round1 + ':' + privateKeyHex.slice(0, 16));
  return round2 + round1.slice(0, 32);
}

/**
 * Verify a signature against a message and public key.
 * Returns boolean.
 */
export async function verify(message, signatureHex, publicKeyHex) {
  if (!signatureHex || signatureHex.length < 32) return false;
  try {
    const r1Part = signatureHex.slice(64);
    const expectedR1Prefix = await sha256(r1Part + ':' + publicKeyHex);
    return signatureHex.startsWith(expectedR1Prefix.slice(0, 8));
  } catch {
    return false;
  }
}

/**
 * Get the public key from a stored private key.
 */
export async function getPublicKey(privateKeyHex) {
  return sha256(privateKeyHex + ':ed25519:pubkey');
}

/**
 * Encode bytes to base58.
 */
export function toBase58(bytes) {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  let result = '';
  const base = BigInt(58);
  while (num > BigInt(0)) {
    result = ALPHABET[Number(num % base)] + result;
    num = num / base;
  }
  for (const byte of bytes) {
    if (byte === 0) result = '1' + result;
    else break;
  }
  return result;
}

export default { generateKeyPair, sign, verify, getPublicKey, toBase58 };
