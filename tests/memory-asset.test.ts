import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAssetRedirect } from '../src/lib/memory-asset';

process.env.WORKER_URL = 'https://worker.test';
process.env.WORKER_OWNER_ADMIN_TOKEN = 'x'.repeat(32);

test('sem user → 401', async () => {
  const r = await resolveAssetRedirect({ user: null, episodeId: '1', kind: 'raw' });
  assert.equal(r.status, 401);
});

test('kind inválido → 400', async () => {
  const r = await resolveAssetRedirect({ user: { userId: 'u' }, episodeId: '1', kind: 'foo' });
  assert.equal(r.status, 400);
});

test('worker 302 → propaga location', async () => {
  const fetchImpl = (async () => new Response(null, { status: 302, headers: { location: 'https://r2/signed' } })) as any;
  const r = await resolveAssetRedirect({ user: { userId: 'u' }, episodeId: '1', kind: 'raw', fetchImpl });
  assert.equal(r.status, 302);
  assert.equal(r.location, 'https://r2/signed');
});

test('worker 404 → 404', async () => {
  const fetchImpl = (async () => new Response(null, { status: 404 })) as any;
  const r = await resolveAssetRedirect({ user: { userId: 'u' }, episodeId: '1', kind: 'audio', fetchImpl });
  assert.equal(r.status, 404);
});
