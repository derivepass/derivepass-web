import init, { derive, encrypt, decrypt } from 'scrypt-crate';

import { flatten } from './ranges';
import {
  type Application,
  type ApplicationData,
  ApplicationDataSchema,
} from '../stores/schemas';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SCRYPT_R = 8;
const SCRYPT_N = 32768;
const SCRYPT_P = 4;

const AES_KEY_SIZE = 32;
const IV_SIZE = 16;
const MAC_KEY_SIZE = 64;

const SCRYPT_AES_DOMAIN = encoder.encode('derivepass/aes');

const alpha = (ch: number): number => {
  // 0-9
  if (ch >= 0x30 && ch <= 0x39) {
    return ch - 0x30;
  } else if (ch >= 0x41 && ch <= 0x46) {
    return ch - 0x41 + 10;
  } else if (ch >= 0x61 && ch <= 0x66) {
    return ch - 0x61 + 10;
  } else {
    throw new Error('Not a hex character, code: ' + ch);
  }
};

export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(`Invalid hex: "${hex}"`);
  }

  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const hi = alpha(hex.charCodeAt(i));
    const lo = alpha(hex.charCodeAt(i + 1));

    out[i >> 1] = (hi << 4) | lo;
  }
  return out;
}

export function toHex(buf: Uint8Array): string {
  let res = '';
  for (let i = 0; i < buf.length; i++) {
    let d = buf[i].toString(16);
    if (d.length < 2) {
      d = '0' + d;
    }
    res += d;
  }
  return res;
}

// Password generation

export type PasswordOptions = Readonly<{
  requiredChars: string;
  allowedChars: string;
  passwordLen: number;
}>;

type PasswordRanges = Readonly<{
  required: ReadonlyArray<string>;
  allowed: ReadonlyArray<string>;
  union: ReadonlyArray<string>;
  passwordLen: number;
}>;

// NOTE: this is upper bound for an entropy, lower bound depends on the size
// of `required` array.

export function passwordEntropyBits(
  { union, passwordLen }: PasswordRanges,
): number {
  return Math.ceil(Math.log2(union.length) * passwordLen);
}

export function toPassword(
  raw: Uint8Array,
  { required: requiredArr, passwordLen, allowed, union }: PasswordRanges,
): string {
  const littleEndian = new Uint8Array([...raw].reverse());
  let num = BigInt('0x' + toHex(littleEndian));

  const required = new Set(requiredArr);

  let out = '';
  while (out.length < passwordLen) {
    let alphabet: ReadonlyArray<string>;

    // Emitted all required chars, move to allowed
    if (required.size === 0) {
      alphabet = allowed;

    // Remaining space has to be filled with required chars
    } else if (required.size === passwordLen - out.length) {
      alphabet = Array.from(required);

    // Just emit any chars
    } else {
      alphabet = union;
    }

    const mod = BigInt(alphabet.length);
    const ch = alphabet[Number(num % mod)];
    num = num / mod;

    required.delete(ch);
    out += ch;
  }

  return out;
}

const LEGACY_PASSWORD_SIZE = 18;

const PASSWORD_BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.'.split('');

function toLegacyPassword(raw: Uint8Array): string {
  if (raw.length !== LEGACY_PASSWORD_SIZE) {
    throw new Error('Invalid raw bytes');
  }

  let out = '';
  for (let i = 0; i < raw.length; i += 3) {
    const a = raw[i];
    const b = raw[i + 1];
    const c = raw[i + 2];

    out += PASSWORD_BASE64[a >>> 2];
    out += PASSWORD_BASE64[((a & 3) << 4) | (b >>> 4)];
    out += PASSWORD_BASE64[((b & 0x0f) << 2) | (c >>> 6)];
    out += PASSWORD_BASE64[c & 0x3f];
  }

  return out;
}

export const DEFAULT_OPTIONS: PasswordOptions = {
  allowedChars: 'a-zA-Z0-9_.',
  requiredChars: '',
  passwordLen: 24,
};

export function isDefaultOptions({
  allowedChars,
  requiredChars,
  passwordLen,
}: PasswordOptions): boolean {
  return allowedChars === DEFAULT_OPTIONS.allowedChars &&
    requiredChars === DEFAULT_OPTIONS.requiredChars &&
    passwordLen === DEFAULT_OPTIONS.passwordLen;
}

export function computePassword(
  { master }: Keys,
  app: Application,
): string {
  const source = `${app.domain}/${app.login}` +
    `${app.revision > 1 ? `#${app.revision}` : ''}`;

  const allowed = flatten(app.allowedChars);
  const required = flatten(app.requiredChars);
  const union = [...new Set([...allowed, ...required])].sort();

  const ranges = {
    allowed,
    required,
    union,
    passwordLen: app.passwordLen,
  };

  const bytes = Math.ceil(passwordEntropyBits(ranges) / 8);
  const raw = derive(
    SCRYPT_R, SCRYPT_N, SCRYPT_P,
    encoder.encode(master),
    encoder.encode(source),
    bytes);

  if (isDefaultOptions(app)) {
    return toLegacyPassword(raw);
  }
  return toPassword(raw, ranges);
}

export type Keys = Readonly<{
  master: string;
  aes: Uint8Array;
  hmac: Uint8Array;
}>;

export function computeKeys(master: string): Keys {
  const buf = derive(
    SCRYPT_R, SCRYPT_N, SCRYPT_P,
    encoder.encode(master),
    SCRYPT_AES_DOMAIN,
    AES_KEY_SIZE + MAC_KEY_SIZE);

  return {
    master,
    aes: buf.slice(0, AES_KEY_SIZE),
    hmac: buf.slice(AES_KEY_SIZE),
  };
}

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

export const initPromise = init();
