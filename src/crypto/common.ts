import init from 'scrypt-crate';

export type Keys = Readonly<{
  master: string;
  aes: Uint8Array;
  hmac: Uint8Array;
}>;

export type PasswordOptions = Readonly<{
  requiredChars: string;
  allowedChars: string;
  passwordLen: number;
}>;

export type PasswordRanges = Readonly<{
  required: ReadonlyArray<string>;
  allowed: ReadonlyArray<string>;
  union: ReadonlyArray<string>;
  passwordLen: number;
}>;


export const DEFAULT_OPTIONS: PasswordOptions = {
  allowedChars: 'a-zA-Z0-9_.',
  requiredChars: '',
  passwordLen: 24,
};

// NOTE: this is upper bound for an entropy, lower bound depends on the size
// of `required` array.

export function passwordEntropyBits(
  { union, passwordLen }: PasswordRanges,
): number {
  return Math.ceil(Math.log2(union.length) * passwordLen);
}

export function isDefaultOptions({
  allowedChars,
  requiredChars,
  passwordLen,
}: PasswordOptions): boolean {
  return allowedChars === DEFAULT_OPTIONS.allowedChars &&
    requiredChars === DEFAULT_OPTIONS.requiredChars &&
    passwordLen === DEFAULT_OPTIONS.passwordLen;
}

function alpha(ch: number): number {
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

export const initPromise = init();
