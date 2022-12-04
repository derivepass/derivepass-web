import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

import {
  type DecryptedApplication,
  type EncryptedApplication,
  type SyncSettings,
  EncryptedApplicationSchema,
  SyncSettingsSchema,
} from './schemas';

const PREFIX = 'dp:v2:';
const ITEM_PREFIX = `${PREFIX}i:`;
const SETTINGS_KEY = `${PREFIX}sync-settings`;

export const settings = writable<SyncSettings | undefined>();

const initialValue = localStorage.getItem(SETTINGS_KEY);
if (initialValue) {
  try {
    settings.set(SyncSettingsSchema.parse(JSON.parse(initialValue)));
  } catch {
    // Ignore
  }
}

settings.subscribe($settings => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify($settings));
});

export function sync(
  store: Writable<ReadonlyArray<DecryptedApplication>>,
): void {
  const initialData = new Array<EncryptedApplication>();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? '';

    if (!key.startsWith(ITEM_PREFIX)) {
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
        `${ITEM_PREFIX}${encrypted.id}`,
        JSON.stringify(encrypted),
      );
    }

    for (const id of removed) {
      localStorage.removeItem(`${ITEM_PREFIX}${id}`);
      modifiedAtById.delete(id);
    }
  });
}
