/**
 * DID Key utilities — generates did:key:z<base58-public-key> strings
 * compatible with the backend's DID format in apps/did/utils/crypto.py
 */
import { hexToBytes, toBase58 } from './ed25519';

/**
 * Generate a DID Key string from a hex-encoded public key.
 * Format: did:key:z<base58(multicodec_prefix + public_key_bytes)>
 */
export function publicKeyToDid(publicKeyHex: string): string {
  const pubBytes = hexToBytes(publicKeyHex);
  const multicodecEd25519Prefix = new Uint8Array([0xed, 0x01]);
  const prefixed = new Uint8Array(multicodecEd25519Prefix.length + pubBytes.length);
  prefixed.set(multicodecEd25519Prefix);
  prefixed.set(pubBytes, multicodecEd25519Prefix.length);
  const b58 = toBase58(prefixed);
  return `did:key:z${b58}`;
}

/**
 * Extract the key method-specific identifier from a DID Key.
 */
export function didToKeyId(did: string): string {
  if (!did.startsWith('did:key:z')) {
    throw new Error('Not a valid did:key DID');
  }
  return did.slice('did:key:'.length);
}

/**
 * Validate that a string is a well-formed did:key DID.
 */
export function isValidDidKey(did: string): boolean {
  return /^did:key:z[1-9A-HJ-NP-Za-km-z]{32,}$/.test(did);
}

export default { publicKeyToDid, didToKeyId, isValidDidKey };
