import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

import {
  type HydratedApplication,
  type StoredApplication,
  type SyncState,
  StoredApplicationSchema,
  SyncStateSchema,
} from './schemas';

const PREFIX = 'dp:v2:';
const ITEM_PREFIX = `${PREFIX}i:`;
const STATE_KEY = `${PREFIX}sync-state`;

export const remoteState = writable<SyncState | undefined>();

const initialValue = localStorage.getItem(STATE_KEY);
if (initialValue) {
  try {
    remoteState.set(SyncStateSchema.parse(JSON.parse(initialValue)));
  } catch {
    // Ignore
  }
}

remoteState.subscribe($remoteState => {
  localStorage.setItem(STATE_KEY, JSON.stringify($remoteState));
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
