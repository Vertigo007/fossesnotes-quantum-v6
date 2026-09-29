import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { Store } from '../src/store.js';
import { createApp } from '../src/app.js';

const TOKEN = 'test-token-0123456789abcdef';
let server;
let base;
let dataDir;
let store;
const sent = [];

// Stand-in for ListingAI so tests never call the network.
const fakeAI = {
  analyzeItem: async ({ images }) => ({
    itemName: 'Perceuse DeWalt 20V', brand: 'DeWalt', model: 'DCD771', categoryId: 'tools', conditionId: 'used_good',
    conditionNotes: '', keyAttributes: [], searchQueries: ['dewalt 20v drill'], estimatedRetailPrice: 199,
    coverPhotoIndex: 0, photoTips: [], policyWarnings: [], _images: images.length,
  }),
  writeListing: async ({ price }) => ({ title: 'Perceuse DeWalt 20V', description: `Fonctionne parfaitement. ${price} $`, alternateTitles: ['Drill DeWalt 20V avec batterie'] }),
  matchComparables: async ({ comparables }) => ({ matches: comparables.map((c, index) => ({ index, match: /dewalt/i.test(c.title) ? 'identical' : 'different' })) }),
  draftReply: async () => ({ reply: 'Oui, toujours disponible!', intent: 'availability', scamSignals: [] }),
};

const api = async (method, url, body, token = TOKEN) => {
  const res = await fetch(`${base}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marketpilot-'));
  store = await new Store(path.join(dataDir, 'db.json')).load();
  const notifier = { enabled: true, send: async (m) => { sent.push(m); return true; } };
  const app = createApp({ store, ai: fakeAI, notifier, config: { apiToken: TOKEN, dataDir, publicUrl: 'http://phone.test', maxPhotosPerSession: 10 } });
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await fs.rm(dataDir, { recursive: true, force: true });
});

test('rejects missing or wrong token', async () => {
  assert.equal((await api('GET', '/api/listings', undefined, null)).status, 401);
  assert.equal((await api('GET', '/api/listings', undefined, 'nope')).status, 401);
});

test('full flow: phone upload → analyze → price → listing → strategy → approve → complete', async () => {
  const session = (await api('POST', '/api/sessions')).body;
  assert.match(session.mobileUrl, /^http:\/\/phone\.test\/m\/s\/ses_\w+#t=/);
  assert.match(session.qrSvg, /<svg/);
  const uploadToken = new URL(session.mobileUrl).hash.slice(3);

  // Upload from "the phone".
  const form = new FormData();
  form.append('photos', new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }), 'a.jpg');
  const bad = await fetch(`${base}/m/api/sessions/${session.id}/photos`, { method: 'POST', headers: { 'x-upload-token': 'wrong' }, body: form });
  assert.equal(bad.status, 401);
  const up = await fetch(`${base}/m/api/sessions/${session.id}/photos`, { method: 'POST', headers: { 'x-upload-token': uploadToken }, body: form });
  assert.equal(up.status, 200);
  assert.equal((await up.json()).count, 1);

  const s = (await api('GET', `/api/sessions/${session.id}`)).body;
  assert.equal(s.photos.length, 1);
  const img = await fetch(`${base}${s.photos[0].url}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  assert.equal(img.headers.get('content-type'), 'image/jpeg');

  const analysis = (await api('POST', '/api/analyze', { sessionId: session.id })).body;
  assert.equal(analysis.item.categoryId, 'tools');
  assert.equal(analysis.category.fr, 'Outils');

  const pricing = (await api('POST', '/api/pricing', {
    item: analysis.item,
    desiredPrice: 120,
    listings: [
      { title: 'Perceuse DeWalt 20V', price: '100 $' },
      { title: 'DeWalt drill 20V with battery', price: '$120' },
      { title: 'Dewalt 20v DCD771', price: '110 $' },
      { title: 'Batterie Milwaukee', price: '60 $' },
    ],
  })).body;
  assert.equal(pricing.usedCount, 3);
  assert.equal(pricing.stats.median, 110);
  assert.ok(pricing.desired.verdict);

  const copy = (await api('POST', '/api/copy', { item: analysis.item, price: 120 })).body;
  const created = await api('POST', '/api/listings', {
    title: copy.title, description: copy.description, price: 120, floorPrice: 90,
    categoryId: 'tools', conditionId: 'used_good', sessionId: session.id, alternateTitles: copy.alternateTitles,
    plan: { mode: 'fast', boost: { enabled: true, minPrice: 50 } },
  });
  assert.equal(created.status, 201);
  const listing = created.body;
  assert.equal(listing.photos.length, 1);
  assert.equal(listing.ladder.at(-1).price, 90);

  // Extension sync from the "Your listings" page marks it active with a FB id.
  const sync = (await api('POST', '/api/listings/sync', { items: [{ fbId: '123456', title: 'Perceuse DeWalt 20V', price: 120, views: 5, messages: 0 }] })).body;
  assert.equal(sync.results[0].listingId, listing.id);
  let current = (await api('GET', `/api/listings/${listing.id}`)).body;
  assert.equal(current.status, 'active');
  assert.equal(current.fbId, '123456');

  // Pretend it was posted 8 days ago.
  const eightDaysAgo = new Date(Date.now() - 8 * 86400000).toISOString();
  await store.update('listings', listing.id, { postedAt: eightDaysAgo });

  const run = (await api('POST', '/api/strategy/run')).body;
  const byType = Object.fromEntries(run.created.map((a) => [a.type, a]));
  assert.ok(byType.price_drop && byType.renew && byType.boost, JSON.stringify(Object.keys(byType)));
  assert.equal(byType.renew.status, 'approved', 'renew is auto-approved');
  assert.equal(byType.price_drop.status, 'pending');
  assert.equal(sent.length, 1, 'phone notified once');
  assert.match(sent[0].click, /\/m\/approvals$/);

  // Second run does not duplicate open proposals.
  assert.equal((await api('POST', '/api/strategy/run')).body.created.length, 0);

  // Below-floor approval refused; custom price accepted.
  assert.equal((await api('POST', `/api/actions/${byType.price_drop.id}/approve`, { price: 50 })).status, 400);
  const approved = (await api('POST', `/api/actions/${byType.price_drop.id}/approve`, { price: 105 })).body;
  assert.equal(approved.payload.to, 105);

  const done = await api('POST', `/api/actions/${byType.price_drop.id}/complete`, {});
  assert.equal(done.body.status, 'done');
  current = (await api('GET', `/api/listings/${listing.id}`)).body;
  assert.equal(current.price, 105);

  // Reject the boost → snoozed, not re-proposed.
  await api('POST', `/api/actions/${byType.boost.id}/reject`, {});
  const rerun = (await api('POST', '/api/strategy/run')).body.created;
  assert.ok(!rerun.some((a) => a.type === 'boost'));

  // Selling it cancels whatever is still queued.
  await api('PATCH', `/api/listings/${listing.id}`, { status: 'sold', soldPrice: 100 });
  const open = (await api('GET', '/api/actions?status=pending,approved')).body.filter((a) => a.listingId === listing.id);
  assert.equal(open.length, 0);
});

test('reply drafting', async () => {
  const l = (await api('POST', '/api/listings', { title: 'Table', price: 50 })).body;
  const r = (await api('POST', '/api/reply', { listingId: l.id, buyerMessage: 'Toujours dispo?' })).body;
  assert.equal(r.intent, 'availability');
});

test('validation errors are 400', async () => {
  assert.equal((await api('POST', '/api/listings', { price: -1 })).status, 400);
});
