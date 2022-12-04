import { fromByteArray } from 'base64-js';

const encoder = new TextEncoder();

export function fromString(value: string): string {
  return fromByteArray(encoder.encode(value));
}
