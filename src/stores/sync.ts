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
    const key = localStorage.key(i) ?? '';

    if (!key.startsWith(PREFIX)) {
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

  const modifiedAtById = new Map<string, number>();

  store.subscribe($store => {
    const updated = new Array<EncryptedApplication>();
    const removed = new Set<string>(modifiedAtById.keys());

    for (const { decrypted: _, ...app } of $store) {
      const encrypted: EncryptedApplication = app;

      removed.delete(app.id);

      const lastModifiedAt = modifiedAtById.get(app.id);
      modifiedAtById.set(app.id, app.modifiedAt);

      if (lastModifiedAt === undefined) {
        updated.push(encrypted);
        continue;
      }

      // No update, skip
      if (lastModifiedAt === encrypted.modifiedAt) {
        continue;
      }

      updated.push(encrypted);
    }

    for (const encrypted of updated) {
      localStorage.setItem(
        `${PREFIX}${encrypted.id}`,
        JSON.stringify(encrypted),
      );
    }

    for (const id of removed) {
      localStorage.removeItem(`${PREFIX}${id}`);
      modifiedAtById.delete(id);
    }
  });
}
