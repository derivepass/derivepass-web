import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import createDebug from 'debug';

import { fromString as base64FromString } from '../util/b64';
import { STORAGE_PREFIX, HOUR } from '../util/constants';
import type { LastModifiedAtStore } from './util/localSync';
import {
  type RemoteSyncState,
  type RemoteApplication,
  type HydratedApplication,
  RemoteSyncStateSchema,
  RemoteApplicationSchema,
  AuthTokenResponseSchema,
  GetObjectsResponseSchema,
  PutObjectsResponseSchema,
} from './schemas';

const debug = createDebug('dp:stores:remoteSync');

const STATE_KEY = `${STORAGE_PREFIX}remote-state`;

export const remoteState = writable<RemoteSyncState | undefined>();

// Just to trigger syncs
const syncTrigger = writable<number>(0);

let syncTimer: number | undefined;

function restartTimer(): void {
  if (syncTimer !== undefined) {
    clearTimeout(syncTimer);
  }
  syncTimer = setTimeout(() => {
    syncTimer = undefined;

    sync();
  }, HOUR);
}

export type RemoteAuth = Readonly<{
  host: string;
  username: string;
  password: string;
}>;

export async function authorize(
  { host, username, password }: RemoteAuth,
): Promise<void> {
  const auth64 = base64FromString(`${username}:${password}`);
  const res = await fetch(`https://${host}/user/token`, {
    method: 'PUT',
    headers: {
      authorization: `Basic ${auth64}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Request failed');
  }
  const { token } = AuthTokenResponseSchema.parse(await res.json());

  const newState: RemoteSyncState = {
    host,
    token,
    lastModifiedAt: 0,
    localLastModifiedAt: 0,
    lastSyncedAt: 0,
  };

  remoteState.set(newState);
  sync();
}

function getDefaultHeaders(
  $remoteState: RemoteSyncState,
): Record<string, string> {
  return {
    authorization: `Bearer ${$remoteState.token}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };
}

export async function unlink(
  oldState: RemoteSyncState | undefined,
): Promise<void> {
  let isStale = true;
  remoteState.update($remoteState => {
    if ($remoteState !== oldState) {
      return $remoteState;
    }

    isStale = false;
    return undefined;
  });
  if (oldState === undefined || isStale) {
    return;
  }

  // Do best effort to reclaim token.
  try {
    await fetch(`https://${oldState.host}/user/token`, {
      method: 'DELETE',
      headers: getDefaultHeaders(oldState),
      body: JSON.stringify({ token: oldState.token }),
    });
  } catch (error) {
    // Ignore
    debug('failed to delete old token', error);
  }
}

export function sync(): void {
  debug('trigger sync');
  syncTrigger.update(x => x+ 1);
}

//
// Plugin
//

export type RunSyncResult = Readonly<{
  updated: Map<string, RemoteApplication>;
}>;

async function handleResponse(
  $remoteState: RemoteSyncState,
  res: Response,
): Promise<void> {
  if (res.status === 401 || res.status === 403) {
    await unlink($remoteState);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send request: ${text}`);
  }
}

async function runSync(
  $remoteState: RemoteSyncState,
  $apps: ReadonlyArray<HydratedApplication>,
): Promise<RunSyncResult> {
  const updated = new Map<string, RemoteApplication>();

  if ($remoteState === undefined) {
    return { updated };
  }

  const url = `https://${$remoteState.host}/objects`;
  const getObjectsRes =
    await fetch(`${url}?since=${$remoteState.lastModifiedAt}`, {
      headers: getDefaultHeaders($remoteState),
    });

  await handleResponse($remoteState, getObjectsRes);

  const { objects } = GetObjectsResponseSchema.parse(
    await getObjectsRes.json(),
  );

  debug(
    'got %d remote objects since %j',
    objects.length,
    $remoteState.lastModifiedAt,
    objects,
  );

  const localOnlyApps = new Map<string, HydratedApplication>(
    $apps.map(app => [app.id, app])
  );

  let lastModifiedAt = $remoteState.lastModifiedAt;
  for (const { id, data, modifiedAt } of objects) {
    lastModifiedAt = Math.max(lastModifiedAt, modifiedAt);
    localOnlyApps.delete(id);

    let app: RemoteApplication;
    try {
      app = RemoteApplicationSchema.parse(JSON.parse(data));
    } catch (error) {
      // Ignore
      debug('failed to parse remote application', data, error);
      continue;
    }

    updated.set(app.id, app);
  }

  // Upload local-only objects
  const newApps = new Array<RemoteApplication>();
  let newLocalLastModifiedAt = $remoteState.localLastModifiedAt;

  // Sort apps so that the server assigns monotonic `modifiedAt` to them.
  const sortedLocalApps = Array.from(localOnlyApps.values()).sort((a, b) => {
    return a.modifiedAt - b.modifiedAt;
  });

  for (const app of sortedLocalApps) {
    if (app.modifiedAt <= $remoteState.localLastModifiedAt) {
      continue;
    }

    newLocalLastModifiedAt = Math.max(newLocalLastModifiedAt, app.modifiedAt);

    newApps.push({
      id: app.id,
      version: app.version,
      encrypted: app.encrypted,
      removed: app.removed,
    });
  }

  if (newApps.length > 0) {
    debug(
      'uploading %d new objects since %j',
      newApps.length,
      $remoteState.localLastModifiedAt,
    );

    const putObjectsRes = await fetch(url, {
      method: 'PUT',
      headers: getDefaultHeaders($remoteState),
      body: JSON.stringify({
        objects: newApps.map(app => {
          return {
            id: app.id,
            data: app,
          };
        }),
      }),
    });
    await handleResponse($remoteState, putObjectsRes);

    const putObjects = PutObjectsResponseSchema.parse(
      await putObjectsRes.json()
    );
    lastModifiedAt = putObjects.modifiedAt;
  }

  // Update state

  const updatedState = {
    ...$remoteState,
    lastModifiedAt,
    localLastModifiedAt: newLocalLastModifiedAt,
    lastSyncedAt: Date.now(),
  };

  remoteState.update(currentState => {
    if (currentState !== $remoteState) {
      return currentState;
    }

    return updatedState;
  });

  return { updated };
}

function applySyncResult(
  $remoteState: RemoteSyncState,
  apps: Writable<ReadonlyArray<HydratedApplication>>,
  lastModifiedAt: LastModifiedAtStore,
  { updated }: RunSyncResult,
): void {
  // Only run updates if modified, otherwise we will loop indefinitely!
  if (updated.size === 0) {
    debug('no changes, not applying results');
    return;
  }

  apps.update($latestApps => {
    const { localLastModifiedAt } = $remoteState;
    let newLastModifiedAt = localLastModifiedAt;

    const newApps = $latestApps.map(app => {
      const remote = updated.get(app.id);
      updated.delete(app.id);

      // App was modified in-flight!
      if (app.modifiedAt > localLastModifiedAt) {
        debug('app %j modified in flight', app.id);
        return app;
      }

      if (remote === undefined) {
        return app;
      }

      newLastModifiedAt = lastModifiedAt.next();

      debug('updated app %j', app.id);
      return {
        ...app,
        encrypted: remote.encrypted,
        modifiedAt: newLastModifiedAt,
      };
    });

    // Add missing apps
    for (const remote of updated.values()) {
      newLastModifiedAt = lastModifiedAt.next();

      debug('added app %j', remote.id);
      newApps.push({
        ...remote,
        modifiedAt: newLastModifiedAt,
      });
    }

    remoteState.update($currentRemoteState => {
      if ($currentRemoteState !== $remoteState) {
        return undefined;
      }

      return {
        ...$currentRemoteState,
        localLastModifiedAt: newLastModifiedAt,
      };
    });

    return newApps;
  });
}

export function initRemoteSync(
  apps: Writable<ReadonlyArray<HydratedApplication>>,
  lastModifiedAt: LastModifiedAtStore,
): void {
  let $remoteState: RemoteSyncState | undefined;

  remoteState.subscribe(newState => $remoteState = newState);

  // Trigger sync anytime either syncTrigger or apps change.
  const appsOrTrigger = derived([apps, syncTrigger], ([$apps]) => $apps);

  let syncCount = 0;

  appsOrTrigger.subscribe(async ($apps) => {
    restartTimer();

    if ($remoteState === undefined) {
      debug('no remote state, not sync');
      return;
    }

    // Sync already running
    if (++syncCount !== 1) {
      debug('%d syncs already running', syncCount);
      return;
    }

    debug('starting sync');

    try {
      const result = await runSync($remoteState, $apps);

      applySyncResult($remoteState, apps, lastModifiedAt, result);
    } catch (error) {
      // Ignore
      debug('failed to run sync or apply sync results', error);
    }

    if (--syncCount === 0) {
      return;
    }

    syncCount = 0;

    debug('re-triggering sync');
    // Re-trigger sync if it was queued while we were already running.
    sync();
  });
}

//
// Persist state
//

const initialValue = localStorage.getItem(STATE_KEY);
if (initialValue) {
  try {
    remoteState.set(RemoteSyncStateSchema.parse(JSON.parse(initialValue)));
  } catch (error) {
    // Ignore
    debug('Failed to update remote state store', error);
  }
}
restartTimer();

remoteState.subscribe(async ($remoteState) => {
  if ($remoteState === undefined) {
    localStorage.removeItem(STATE_KEY);
    return;
  }

  localStorage.setItem(STATE_KEY, JSON.stringify($remoteState));
});
