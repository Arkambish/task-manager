import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { QueryClient, MutationObserver } from '@tanstack/react-query';
import { formatDateOnly } from '../src/lib/dates.ts';
import { statusMutationOptions, TASKS_QUERY_KEY } from '../src/features/tasks/status-mutation.ts';

process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001///';
const { apiRequest, ApiError } = await import('../src/lib/api-client.ts');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const task = (id) => ({ id, title: id, status: 'TODO', description: null, dueDate: null, createdAt: '2026-11-25T00:00:00Z' });

test('a failed status update preserves a concurrent change and waits to refresh', async () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(TASKS_QUERY_KEY, [task('a'), task('b')]);
  const a = deferred(), b = deferred();
  const startedA = deferred(), startedB = deferred();
  const options = statusMutationOptions(client, (id) => {
    (id === 'a' ? startedA : startedB).resolve();
    return (id === 'a' ? a : b).promise;
  });
  const invalidations = mock.method(client, 'invalidateQueries', async () => {});
  try {
    const first = new MutationObserver(client, options).mutate({ id: 'a', status: 'DONE' });
    const failed = assert.rejects(first, /refused/);
    await startedA.promise;
    const second = new MutationObserver(client, options).mutate({ id: 'b', status: 'IN_PROGRESS' });
    await startedB.promise;
    // Another action edits a field while the status requests are pending.
    client.setQueryData(TASKS_QUERY_KEY, (tasks) => tasks.map((t) => t.id === 'a' ? { ...t, title: 'Edited' } : t));
    a.reject(new Error('refused'));
    await failed;
    assert.deepEqual(client.getQueryData(TASKS_QUERY_KEY).map(({ status, title }) => ({ status, title })), [
      { status: 'TODO', title: 'Edited' }, { status: 'IN_PROGRESS', title: 'b' },
    ]);
    assert.equal(invalidations.mock.callCount(), 0);
    b.resolve({ ...task('b'), status: 'IN_PROGRESS' });
    await second;
    assert.equal(invalidations.mock.callCount(), 1);
  } finally {
    client.clear();
    invalidations.mock.restore();
  }
});

test('calendar years below 100 are displayed without adding 1900', () => {
  const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
  for (const value of ['0000-02-29', '0001-01-01', '0099-12-31', '2026-12-04']) {
    assert.equal(formatDateOnly(value), formatter.format(new Date(`${value}T00:00:00`)));
  }
});

test('a trailing slash in the API URL does not create a double slash', async () => {
  const fetch = mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, 'http://localhost:3001/tasks');
    return Response.json([]);
  });
  try { assert.deepEqual(await apiRequest('/tasks'), []); }
  finally { fetch.mock.restore(); }
});

test('unreadable success responses become displayable API errors', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => new Response('<html>proxy</html>'));
  try {
    await assert.rejects(apiRequest('/tasks'), (error) => error instanceof ApiError && error.status === 200 && /unreadable/.test(error.message));
  } finally { fetch.mock.restore(); }
});

test('a stalled request times out with a warning about retrying writes', async () => {
  const controller = new AbortController();
  const timeout = mock.method(AbortSignal, 'timeout', (ms) => {
    assert.equal(ms, 15_000);
    return controller.signal;
  });
  const fetch = mock.method(globalThis, 'fetch', async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  try {
    const pending = apiRequest('/tasks', { method: 'POST', body: { title: 'New' } });
    controller.abort(new DOMException('Timed out', 'TimeoutError'));
    await assert.rejects(pending, (error) => error instanceof ApiError && /timed out/.test(error.message) && /may have saved/.test(error.message));
  } finally { fetch.mock.restore(); timeout.mock.restore(); }
});

test('a stalled response body is also covered by the request timeout', async () => {
  const controller = new AbortController();
  const timeout = mock.method(AbortSignal, 'timeout', () => controller.signal);
  const fetch = mock.method(globalThis, 'fetch', async () => ({ ok: true, status: 200, json: async () => {
    controller.abort(new DOMException('Timed out', 'TimeoutError'));
    throw controller.signal.reason;
  } }));
  try { await assert.rejects(apiRequest('/tasks'), (error) => error instanceof ApiError && /timed out/.test(error.message)); }
  finally { fetch.mock.restore(); timeout.mock.restore(); }
});

test('validation errors and empty DELETE responses keep their existing behavior', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => Response.json({ message: ['Title is required'] }, { status: 400 }));
  try {
    await assert.rejects(apiRequest('/tasks'), (error) => error instanceof ApiError && error.status === 400 && error.messages[0] === 'Title is required');
    fetch.mock.mockImplementation(async () => new Response(null, { status: 204 }));
    assert.equal(await apiRequest('/tasks/a', { method: 'DELETE' }), undefined);
  } finally { fetch.mock.restore(); }
});
