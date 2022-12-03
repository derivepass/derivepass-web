//@ts-ignore
import init, { derive, encrypt, decrypt, decrypt_legacy } from 'scrypt-crate';

const SCRYPT_R = 8;
const SCRYPT_N = 32768;
const SCRYPT_P = 4;

export function derivepass(
  master: Uint8Array,
  domain: Uint8Array,
  outSize: number,
) {
  return derive(SCRYPT_R, SCRYPT_N, SCRYPT_P, master, domain, outSize);
}

export const initPromise = init();

export { encrypt, decrypt, decrypt_legacy };
