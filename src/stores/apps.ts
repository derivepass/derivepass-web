import { writable, derived } from 'svelte/store';
import { nanoid } from 'nanoid';

import type { Keys } from '../crypto/common';
import {
  encryptApplication,
  decryptApplication,
} from '../crypto/apps';
import { DEFAULT_OPTIONS } from '../util/presets';
import {
  type Application,
  type ApplicationData,
  type HydratedApplication,
  VERSION,
} from './schemas';
import { keys } from './crypto';
import { initLocalSync } from './util/localSync';
import { initRemoteSync } from './remoteSync';
import { migrator } from './util/migrator';

const store = writable<ReadonlyArray<HydratedApplication>>([]);

const { lastModifiedAt } = initLocalSync(store);

initRemoteSync(store, lastModifiedAt);
migrator(store);

// Erase "encrypted" key and decrypt on apps on any key change.
keys.subscribe($keys => {
  store.update(list => {
    return list.map(({ decrypted: _, encrypted, ...rest }) => {
      let decrypted: ApplicationData | undefined;

      if (rest.removed) {
        return {
          encrypted: '',
          ...rest,
        };
      }

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
          if (x.removed || x.decrypted === undefined) {
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
      return list.map(entry => {
        if (entry.id === id) {
          return {
            id: entry.id,
            version: entry.version,
            encrypted: '',
            removed: true,
            modifiedAt: lastModifiedAt.next(),
          };
        }
        return entry;
      });
    });
  },

  save(keys: Keys, { id, version, ...data }: Application): void {
    const encrypted = encryptApplication(keys, data);
    const newEntry = {
      id,
      version,
      decrypted: data,
      encrypted,
      modifiedAt: lastModifiedAt.next(),
    };

    store.update(list => {
      let found = false;

      const modifiedList = list.map(entry => {
        if (entry.id === newEntry.id) {
          found = true;
          return newEntry;
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
