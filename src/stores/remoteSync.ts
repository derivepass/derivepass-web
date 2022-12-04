import { writable } from 'svelte/store';
import { fromString as base64FromString } from '../util/b64';

import { STORAGE_PREFIX } from '../util/constants';
import {
  type RemoteSyncState,
  RemoteSyncStateSchema,
  AuthTokenResponseSchema,
} from './schemas';

const STATE_KEY = `${STORAGE_PREFIX}remote-state`;

export const remoteState = writable<RemoteSyncState | undefined>();

const initialValue = localStorage.getItem(STATE_KEY);
if (initialValue) {
  try {
    remoteState.set(RemoteSyncStateSchema.parse(JSON.parse(initialValue)));
  } catch {
    // Ignore
  }
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
    },
  });

  if (!res.ok) {
    throw new Error('Request failed');
  }
  const { token } = AuthTokenResponseSchema.parse(await res.json());

  remoteState.set({
    host,
    token,
    lastModifiedAt: 0,
    lastSyncedAt: 0,
  });
}

function getLatestState(): RemoteSyncState | undefined {
  let result: RemoteSyncState | undefined;
  remoteState.subscribe($remoteState => {
    result = $remoteState;
  })();
  return result;
}

export async function unlink(): Promise<void> {
  const oldState = getLatestState();

  remoteState.set(undefined);
  if (oldState === undefined) {
    return;
  }

  // Do best effort to reclaim token.
  try {
    await fetch(`https://${oldState.host}/user/token`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${oldState.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ token: oldState.token }),
    });
  } catch {
    // Ignore
  }
}

remoteState.subscribe($remoteState => {
  if ($remoteState === undefined) {
    localStorage.removeItem(STATE_KEY);
    return;
  }

  localStorage.setItem(STATE_KEY, JSON.stringify($remoteState));

});
