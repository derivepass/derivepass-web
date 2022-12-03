import { writable } from 'svelte/store';

import type { Application } from './schemas';

export const apps = writable<ReadonlyArray<Application>>([
  {
    id: 'test',
    v: 1,

    domain: 'signal.org',
    login: 'indutny',
    revision: 1,

    allowedChars: 'a-z',
    requiredChars: '',
    passwordLen: 24,
  },
  {
    id: 'test-2',
    v: 1,

    domain: 'gmail.com',
    login: 'tester',
    revision: 2,

    allowedChars: 'a-z',
    requiredChars: '',
    passwordLen: 24,
  }
]);
