import { writable } from 'svelte/store';

import type { Keys } from '../util/crypto';
import { MINUTE } from '../util/constants';

export const keys = writable<Keys | undefined>();

let autoLogoutTimer: number | undefined;

keys.subscribe($keys => {
  if (autoLogoutTimer !== undefined) {
    clearTimeout(autoLogoutTimer);
    autoLogoutTimer = undefined;
  }

  if ($keys === undefined) {
    return;
  }

  autoLogoutTimer = setTimeout(() => {
    keys.set(undefined);
  }, 15 * MINUTE);
});
