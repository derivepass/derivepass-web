import type { Readable, Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import createDebug from 'debug';

import { STORAGE_PREFIX } from '../../util/constants';
import {
  type HydratedApplication,
  type StoredApplication,
  StoredApplicationSchema,
} from '../schemas';

const debug = createDebug('dp:localSync');

const ITEM_PREFIX = `${STORAGE_PREFIX}i:`;

export type LastModifiedAtStore = Readable<number> & Readonly<{
  next(): number;
}>;

export type LocalSyncResult = Readonly<{
  lastModifiedAt: LastModifiedAtStore;
}>;

export function initLocalSync(
  apps: Writable<ReadonlyArray<HydratedApplication>>,
): LocalSyncResult {
  const initialData = new Array<StoredApplication>();

  // Used in `getNextModifiedAt` below.
  const lastModifiedAt = writable(0);

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? '';

    if (!key.startsWith(ITEM_PREFIX)) {
      continue;
    }

    try {
      const value = JSON.parse(localStorage.getItem(key) ?? '');

      const app = StoredApplicationSchema.parse(value);

      lastModifiedAt.update($lastModifiedAt => {
        return Math.max($lastModifiedAt, app.modifiedAt);
      });
      initialData.push(app);
    } catch {
      // Ignore bad values
    }
  }


  debug('loaded %d apps', initialData.length);
  apps.set(initialData);

  const modifiedAtById = new Map<string, number>();

  apps.subscribe($apps => {
    const updated = new Array<StoredApplication>();

    for (const { decrypted: _, ...app } of $apps) {
      const stored: StoredApplication = app;

      const modifiedAt = modifiedAtById.get(app.id);
      modifiedAtById.set(app.id, app.modifiedAt);

      if (modifiedAt === undefined) {
        updated.push(stored);
        continue;
      }

      // No update, skip
      if (modifiedAt === stored.modifiedAt) {
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

  return {
    lastModifiedAt: {
      subscribe: lastModifiedAt.subscribe,
      next(): number {
        // Make sure that we produce unique increasing `modifiedAt` for updated
        // items. This invariant is used in `remoteSync`.
        let result = Date.now();
        lastModifiedAt.update($lastModifiedAt => {
          result = Math.max(result, $lastModifiedAt + 1);
          return result;
        });
        return result;
      },
    },
  };
}
