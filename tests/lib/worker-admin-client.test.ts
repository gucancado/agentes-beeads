import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Setamos env ANTES do import do client (server-only foi removido para compatibilidade com testes).
process.env.WORKER_URL = 'http://fake-worker';
process.env.WORKER_OWNER_ADMIN_TOKEN = 'a'.repeat(64);

import {
  createProject,
  updateAgenda,
  WorkerAdminError,
  WorkerTimeoutError,
  WorkerUnreachableError,
  StaleWriteError,
} from '../../src/lib/worker-admin-client.js';

type Captured = { url: string; init: RequestInit };
let captured: Captured[] = [];
let nextResponse: { status: number; body: string } = { status: 200, body: '{}' };
let shouldHang = false;
let shouldThrowNetwork = false;

const originalFetch = global.fetch;

beforeEach(() => {
  captured = [];
  nextResponse = { status: 200, body: '{}' };
  shouldHang = false;
  shouldThrowNetwork = false;

  global.fetch = (async (url: string | URL, init?: RequestInit) => {
    captured.push({ url: String(url), init: init ?? {} });
    if (shouldThrowNetwork) {
      throw new TypeError('fetch failed');
    }
    if (shouldHang) {
      // Respeita o AbortSignal passado pelo workerFetch, simulando fetch real
      await new Promise<never>((_res, rej) => {
        const signal = init?.signal as AbortSignal | undefined;
        if (signal) {
          signal.addEventListener('abort', () => {
            const err = new DOMException('The operation was aborted.', 'AbortError');
            rej(err);
          });
        }
      });
      // unreachable
    }
    return new Response(nextResponse.body, { status: nextResponse.status });
  }) as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

test('createProject envia X-Owner-Token + body correto', async () => {
  nextResponse = { status: 201, body: JSON.stringify({ id: 1, agent: 'm', slug: 's', display_name: 'S', created_at: '', updated_at: '' }) };
  await createProject({ agent: 'mercurio', slug: 'acme', display_name: 'ACME' });
  assert.equal(captured.length, 1);
  assert.equal(captured[0]!.url, 'http://fake-worker/admin/agents/mercurio/projects');
  const headers = captured[0]!.init.headers as Record<string, string>;
  assert.equal(headers['X-Owner-Token'], 'a'.repeat(64));
  assert.equal(headers['Content-Type'], 'application/json');
  assert.equal(JSON.parse(String(captured[0]!.init.body)).slug, 'acme');
});

test('createProject propaga X-Acting-User quando actingUser passado', async () => {
  nextResponse = { status: 201, body: JSON.stringify({ id: 1, agent: 'm', slug: 's', display_name: 'S', created_at: '', updated_at: '' }) };
  await createProject({ agent: 'm', slug: 's', display_name: 'S' }, { actingUser: 'owner@beeads.com.br' });
  const headers = captured[0]!.init.headers as Record<string, string>;
  assert.equal(headers['X-Acting-User'], 'owner@beeads.com.br');
});

test('createProject NÃO envia X-Acting-User quando não passado', async () => {
  nextResponse = { status: 201, body: JSON.stringify({ id: 1, agent: 'm', slug: 's', display_name: 'S', created_at: '', updated_at: '' }) };
  await createProject({ agent: 'm', slug: 's', display_name: 'S' });
  const headers = captured[0]!.init.headers as Record<string, string>;
  assert.equal(headers['X-Acting-User'], undefined);
});

test('erro 400 vira WorkerAdminError com body preservado', async () => {
  nextResponse = { status: 400, body: '{"error":"validation failed","issues":[]}' };
  await assert.rejects(
    () => createProject({ agent: 'm', slug: 's', display_name: 'S' }),
    (err: unknown) => {
      assert.ok(err instanceof WorkerAdminError);
      assert.equal((err as InstanceType<typeof WorkerAdminError>).status, 400);
      assert.match((err as InstanceType<typeof WorkerAdminError>).bodyMessage, /validation failed/);
      return true;
    }
  );
});

test('erro 409 com current vira StaleWriteError', async () => {
  nextResponse = { status: 409, body: '{"error":"stale write","current":{"id":42}}' };
  await assert.rejects(
    () => updateAgenda('m', 's', 42, { display_label: 'x', if_match_updated_at: '2026-01-01T00:00:00Z' }),
    (err: unknown) => {
      assert.ok(err instanceof StaleWriteError);
      const current = (err as InstanceType<typeof StaleWriteError>).current as { id?: number };
      assert.equal(current?.id, 42);
      return true;
    }
  );
});

test('timeout dispara WorkerTimeoutError', async () => {
  shouldHang = true;
  await assert.rejects(
    () => createProject({ agent: 'm', slug: 's', display_name: 'S' }, { timeoutMs: 50 }),
    (err: unknown) => {
      assert.ok(err instanceof WorkerTimeoutError);
      return true;
    }
  );
});

test('falha de network (TypeError) vira WorkerUnreachableError', async () => {
  shouldThrowNetwork = true;
  await assert.rejects(
    () => createProject({ agent: 'm', slug: 's', display_name: 'S' }),
    (err: unknown) => {
      assert.ok(err instanceof WorkerUnreachableError);
      return true;
    }
  );
});

test('erro 5xx vira WorkerAdminError (não Timeout/Unreachable)', async () => {
  nextResponse = { status: 503, body: 'service unavailable' };
  await assert.rejects(
    () => createProject({ agent: 'm', slug: 's', display_name: 'S' }),
    (err: unknown) => {
      assert.ok(err instanceof WorkerAdminError);
      assert.equal((err as InstanceType<typeof WorkerAdminError>).status, 503);
      return true;
    }
  );
});
