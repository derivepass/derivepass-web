import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

import {
  type HydratedApplication,
  type StoredApplication,
  type SyncSettings,
  StoredApplicationSchema,
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
  store: Writable<ReadonlyArray<HydratedApplication>>,
): void {
  const initialData = new Array<StoredApplication>();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? '';

    if (!key.startsWith(ITEM_PREFIX)) {
      continue;
    }

    try {
      const value = JSON.parse(localStorage.getItem(key) ?? '');

      const app = StoredApplicationSchema.parse(value);

      initialData.push(app);
    } catch {
      // Ignore bad values
    }
  }

  store.set(initialData);

  const modifiedAtById = new Map<string, number>();

  store.subscribe($store => {
    const updated = new Array<StoredApplication>();

    for (const { decrypted: _, ...app } of $store) {
      const stored: StoredApplication = app;

      const lastModifiedAt = modifiedAtById.get(app.id);
      modifiedAtById.set(app.id, app.modifiedAt);

      if (lastModifiedAt === undefined) {
        updated.push(stored);
        continue;
      }

      // No update, skip
      if (lastModifiedAt === stored.modifiedAt) {
        continue;
      }

      updated.push(stored);
    }

    for (const stored of updated) {
      localStorage.setItem(
        `${ITEM_PREFIX}${stored.id}`,
        JSON.stringify(stored),
      );
    }
  });
}
