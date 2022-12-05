import type { Application } from '../stores/schemas';
import CryptoWorker from './worker?worker';
import type { WorkerRequest, WorkerResponse } from './worker';
import type { Keys } from './common';

const worker = new CryptoWorker();
const requests = new Array<(response: WorkerResponse) => void>;

worker.addEventListener('message', (e) => {
  const response: WorkerResponse = e.data;

  requests.shift()?.(response);
});

function send(request: WorkerRequest): Promise<WorkerResponse> {
  return new Promise<WorkerResponse>((resolve) => {
    requests.push(resolve);
    worker.postMessage(request);
  });
}

export async function computePassword(
  keys: Keys,
  app: Application,
): Promise<string> {
  const res = await send({ type: 'computePassword', keys, app });

  if (res.type !== 'computePassword') {
    throw new Error('Invalid response');
  }

  return res.result;
}

export async function computeKeys(master: string): Promise<Keys> {
  const res = await send({ type: 'computeKeys', master });

  if (res.type !== 'computeKeys') {
    throw new Error('Invalid response');
  }

  return res.result;
}
