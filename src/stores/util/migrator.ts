import type { Writable } from 'svelte/store';
import { nanoid } from 'nanoid';
import createDebug from 'debug';

import {
  decryptLegacyString,
  encryptApplication,
} from '../../crypto/apps';
import {
  type HydratedApplication,
  LegacyApplicationSchema,
  LegacyOptionsSchema,
  VERSION,
} from '../schemas';
import { keys } from '../crypto';

const debug = createDebug('dp:migrator');

const LEGACY_PREFIX = 'derivepass/production/';

export function migrator(
  store: Writable<ReadonlyArray<HydratedApplication>>,
): void {
  keys.subscribe($keys => {
    if ($keys === undefined) {
      return;
    }

    // Every time keys change - try to decrypt old records and migrate them
    // to new ones.
    let migrated = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? '';

      if (!key.startsWith(LEGACY_PREFIX)) {
        continue;
      }

      try {
        const json = JSON.parse(localStorage.getItem(key) ?? '');

        const {
          changedAt: modifiedAt,
          domain: encryptedDomain,
          login: encryptedLogin,
          revision: encryptedRevision,
          options: encryptedOptions,
          removed,
        } = LegacyApplicationSchema.parse(json);

        if (removed) {
          continue;
        }

        const domain = decryptLegacyString($keys, encryptedDomain);
        const login = decryptLegacyString($keys, encryptedLogin);
        const revisionStr = decryptLegacyString($keys, encryptedRevision);
        const options = LegacyOptionsSchema.parse(
          JSON.parse(decryptLegacyString($keys, encryptedOptions))
        );

        const revision = parseInt(revisionStr, 10);
        if (revision < 1 || isNaN(revision)) {
          throw new Error('Negative or NaN revision');
        }

        const {
          allowed: allowedChars,
          required: requiredChars,
          maxLength,
        } = options;

        const passwordLen = typeof maxLength === 'number' ?
          maxLength :
          parseInt(maxLength, 10);
        if (passwordLen < 1 || isNaN(passwordLen)) {
          throw new Error('Negative or NaN passwordLen');
        }

        const encrypted = encryptApplication($keys, {
          domain,
          login,
          revision,
          allowedChars,
          requiredChars,
          passwordLen,
        });

        store.update(list => {
          return [
            ...list,
            {
              // Ignore old uuid
              id: nanoid(),
              version: VERSION,
              encrypted,
              modifiedAt,
            },
          ];
        });

        localStorage.removeItem(key);

        migrated++;
      } catch {
        // Ignore
      }
    }

    debug('migrated %d records', migrated);
  });
}
