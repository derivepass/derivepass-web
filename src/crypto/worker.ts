import { derive } from 'scrypt-crate';

import { flatten } from '../util/ranges';
import type { Application } from '../stores/schemas';
import {
  initPromise,
  toHex,
  isDefaultOptions,
  passwordEntropyBits,
  type Keys,
  type PasswordRanges,
} from './common';

const encoder = new TextEncoder();

const SCRYPT_R = 8;
const SCRYPT_N = 32768;
const SCRYPT_P = 4;

const AES_KEY_SIZE = 32;
const MAC_KEY_SIZE = 64;

const SCRYPT_AES_DOMAIN = encoder.encode('derivepass/aes');

function toPassword(
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

export type WorkerRequest = Readonly<{
  type: 'computeKeys';
  master: string;
} | {
  type: 'computePassword';
  keys: Keys;
  app: Application;
}>;

export type WorkerResponse = Readonly<{
  type: 'computeKeys';
  result: Keys;
} | {
  type: 'computePassword';
  result: string;
}>;

onmessage = async (e) => {
  await initPromise;

  const data: WorkerRequest = e.data;

  let res: WorkerResponse;
  if (data.type === 'computeKeys') {
    res = { type: 'computeKeys', result: computeKeys(data.master) };
  } else {
    res = {
      type: 'computePassword',
      result: computePassword(data.keys, data.app),
    };
  }
  postMessage(res);
}
