import type { Writable } from 'svelte/store';

import {
  type DecryptedApplication,
  type EncryptedApplication,
  EncryptedApplicationSchema,
} from './schemas';

const PREFIX = 'dp:v2:';

export function sync(
  store: Writable<ReadonlyArray<DecryptedApplication>>,
): void {
  const initialData = new Array<EncryptedApplication>();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) {
      continue;
    }

    try {
      const value = JSON.parse(localStorage.getItem(key) ?? '');

      const app = EncryptedApplicationSchema.parse(value);

      initialData.push(app);
    } catch {
      // Ignore bad values
    }
  }

  store.set(initialData);

  store.subscribe($store => {
    for (const { decrypted:_, ...app } of $store) {
      const encrypted: EncryptedApplication = app;

      localStorage.setItem(
        `${PREFIX}${app.id}`,
        JSON.stringify(encrypted),
      );
    }
  });
}
