import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { Store } from '../src/store.js';
import { createApp } from '../src/app.js';

const TOKEN = 'pair-token-0123456789abcdef';

async function start(localPairing) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mp-pair-'));
  const store = await new Store(path.join(dataDir, 'db.json')).load();
  const app = createApp({ store, ai: null, notifier: null, config: { apiToken: TOKEN, dataDir, publicUrl: 'http://192.168.1.20:8787', maxPhotosPerSession: 10, localPairing } });
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  return { base: `http://127.0.0.1:${server.address().port}`, close: async () => { server.close(); await fs.rm(dataDir, { recursive: true, force: true }); } };
}

test('local pairing hands the token only to an extension on this computer', async () => {
  const { base, close } = await start(true);
  try {
    const ok = await fetch(`${base}/api/pair`, { headers: { Origin: 'chrome-extension://abcdefghijklmnop' } });
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { token: TOKEN, publicUrl: 'http://192.168.1.20:8787' });

    // A website open in the browser sends its own Origin.
    assert.equal((await fetch(`${base}/api/pair`, { headers: { Origin: 'https://evil.example' } })).status, 403);
    assert.equal((await fetch(`${base}/api/pair`)).status, 403);
    // Requests relayed by a proxy are never trusted for pairing.
    assert.equal((await fetch(`${base}/api/pair`, { headers: { Origin: 'chrome-extension://x', 'X-Forwarded-For': '127.0.0.1' } })).status, 403);

    const qr = await fetch(`${base}/m/qr`);
    assert.equal(qr.status, 200);
    assert.match(await qr.text(), /<svg/);
  } finally {
    await close();
  }
});

test('pairing and the QR page are off when hosted online', async () => {
  const { base, close } = await start(false);
  try {
    assert.equal((await fetch(`${base}/api/pair`, { headers: { Origin: 'chrome-extension://x' } })).status, 403);
    assert.equal((await fetch(`${base}/m/qr`)).status, 403);
  } finally {
    await close();
  }
});
