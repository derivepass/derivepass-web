import { encrypt, decrypt, decrypt_legacy } from 'scrypt-crate';

import {
  type ApplicationData,
  ApplicationDataSchema,
} from '../stores/schemas';
import { fromHex, toHex, type Keys } from './common';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const IV_SIZE = 16;

export function encryptApplication({
  aes,
  hmac,
}: Keys, application: ApplicationData): string {
  const payload = encoder.encode(JSON.stringify(application));

  const iv = new Uint8Array(IV_SIZE);
  window.crypto.getRandomValues(iv);

  return toHex(encrypt(aes, hmac, iv, payload));
}

export function decryptApplication({
  aes,
  hmac,
}: Keys, hex: string): ApplicationData {
  const json = JSON.parse(decoder.decode(decrypt(aes, hmac, fromHex(hex))));
  return ApplicationDataSchema.parse(json);
}

export function decryptLegacyString({
  aes,
  hmac,
}: Keys, value: string): string {
  if (value.startsWith('v1:')) {
    return decoder.decode(decrypt(aes, hmac, fromHex(value.slice(3))));
  }
  return decoder.decode(decrypt_legacy(aes, fromHex(value)));
}
