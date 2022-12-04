import { writable, derived } from 'svelte/store';
import { nanoid } from 'nanoid';

import type { Application } from './schemas';
import { DEFAULT_OPTIONS } from '../util/crypto';

const VERSION = 1;

export type StoreEntry = Readonly<{
  application: Application;
  modifiedAt: Date;
}>;

const store = writable<ReadonlyArray<StoreEntry>>([]);

let latestList: ReadonlyArray<StoreEntry>;
store.subscribe(newList => latestList = newList);

export const apps = {
  subscribe: derived(
    store,
    $store => {
      return $store
        .slice()
        .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
        .map(x => x.application);
    },
  ).subscribe,

  getTemplate(): Application {
    return {
      v: VERSION,
      id: nanoid(),

      domain: '',
      login: '',
      revision: 1,

      ...DEFAULT_OPTIONS,
    };
  },

  getById(id: string): Application | undefined {
    return latestList
      .map(entry => entry.application)
      .find(app => app.id === id);
  },

  deleteById(id: string): void {
    store.update(list => {
      return list.filter(({ application }) => application.id !== id);
    });
  },

  save(data: Application): void {
    store.update(list => {
      let found = false;

      const modifiedList = list.map(entry => {
        if (entry.application.id === data.id) {
          found = true;
          return {
            application: data,
            modifiedAt: new Date(),
          };
        }
        return entry;
      });

      if (found) {
        return modifiedList;
      }

      return [
        ...list,
        {
          application: { ...data },
          modifiedAt: new Date(),
        },
      ];
    });
  },
};
