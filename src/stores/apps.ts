import { writable, derived } from 'svelte/store';
import { nanoid } from 'nanoid';

import {
  type Keys,
  DEFAULT_OPTIONS,
  encryptApplication,
  decryptApplication,
} from '../util/crypto';
import type {
  Application,
  ApplicationData,
  DecryptedApplication,
} from './schemas';
import { keys } from './crypto';
import { sync } from './sync';

const VERSION = 1;

const store = writable<ReadonlyArray<DecryptedApplication>>([]);

sync(store);

// Erase "encrypted" key and decrypt on apps on any key change.
keys.subscribe($keys => {
  store.update(list => {
    return list.map(({ decrypted: _, encrypted, ...rest }) => {
      let decrypted: ApplicationData | undefined;

      if ($keys !== undefined) {
        try {
          decrypted = decryptApplication($keys, encrypted);
        } catch {
          // ignore
        }
      }

      return {
        decrypted,
        encrypted,
        ...rest,
      };
    });
  });
});

export const apps = {
  // Combine decrypted data with header to get Application entries
  subscribe: derived(
    store,
    $store => {
      return $store
        .slice()
        .sort((a, b) => b.modifiedAt - a.modifiedAt)
        .map(x => {
          if (x.decrypted === undefined) {
            return undefined;
          }

          return {
            id: x.id,
            version: x.version,
            ...x.decrypted,
          };
        })
        .filter((x): x is Application => x !== undefined);
    },
  ).subscribe,

  getTemplate(): Application {
    return {
      id: nanoid(),
      version: VERSION,

      domain: '',
      login: '',
      revision: 1,

      ...DEFAULT_OPTIONS,
    };
  },

  deleteById(id: string): void {
    store.update(list => {
      return list.filter(entry => entry.id !== id);
    });
  },

  save(keys: Keys, { id, version, ...data }: Application): void {
    const encrypted = encryptApplication(keys, data);
    const newEntry = {
      id,
      version,
      decrypted: data,
      encrypted,
      modifiedAt: Date.now(),
    };

    store.update(list => {
      let found = false;

      const modifiedList = list.map(entry => {
        if (entry.id === newEntry.id) {
          found = true;
          return {
            ...newEntry,

            // Make sure that we always increment `modifiedAt` on updates.
            modifiedAt: Math.max(entry.modifiedAt + 1, newEntry.modifiedAt),
          };
        }
        return entry;
      });

      if (found) {
        return modifiedList;
      }

      return [
        ...list,
        newEntry,
      ];
    });
  },
};
