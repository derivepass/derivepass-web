import { writable } from 'svelte/store';

import type { Keys } from '../util/crypto';

export const keys = writable<Keys | undefined>();
