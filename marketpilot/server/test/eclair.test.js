import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { Store } from '../src/store.js';
import { createApp } from '../src/app.js';
import { choosePrice, estimateFromRetail } from '../src/pipeline.js';
import { computeStats } from '../src/stats.js';

const TOKEN = 'eclair-token-0123456789abcdef';
let server, base, dataDir, store, app;
const sent = [];
const calls = { analyze: 0, write: 0, failNextAnalyze: false, retail: 199, lastReply: null };

const fakeAI = {
  analyzeItem: async ({ images, notes }) => {
    calls.analyze++;
    if (calls.failNextAnalyze) { calls.failNextAnalyze = false; throw new Error('surcharge temporaire'); }
    return {
      itemName: 'Perceuse DeWalt 20V', brand: 'DeWalt', model: 'DCD771', categoryId: 'tools', conditionId: 'used_good',
      conditionNotes: '', keyAttributes: [], searchQueries: ['dewalt 20v drill'], estimatedRetailPrice: calls.retail,
      coverPhotoIndex: images.length > 1 ? 1 : 0, photoTips: [], policyWarnings: [], _notes: notes,
    };
  },
  writeListing: async ({ price }) => {
    calls.write++;
    assert.equal(price, null, 'copy is written without a price');
    return { title: 'Perceuse DeWalt 20V + batterie', description: 'Fonctionne parfaitement. Prix discutable.', alternateTitles: ['Drill DeWalt 20V'] };
  },
  matchComparables: async ({ comparables }) => ({ matches: comparables.map((c, index) => ({ index, match: /dewalt/i.test(c.title) ? 'identical' : 'different' })) }),
  draftReply: async (input) => { calls.lastReply = input; return { reply: 'Oui, encore disponible! Ce soir 19 h?', intent: 'availability', scamSignals: [] }; },
};

const api = async (method, url, body) => {
  const res = await fetch(`${base}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

async function sessionWithPhotos(n = 2) {
  const session = (await api('POST', '/api/sessions')).body;
  const form = new FormData();
  for (let i = 0; i < n; i++) form.append('photos', new Blob([Buffer.from([0xff, 0xd8, i, 0xff, 0xd9])], { type: 'image/jpeg' }), `${i}.jpg`);
  const res = await fetch(`${base}/m/api/sessions/${session.id}/photos`, { method: 'POST', headers: { 'x-upload-token': new URL(session.mobileUrl).hash.slice(3) }, body: form });
  assert.equal(res.status, 200);
  return session;
}

const COMPARABLES = [
  { title: 'Perceuse DeWalt 20V', price: '100 $' },
  { title: 'DeWalt drill 20V with battery', price: '$120' },
  { title: 'Dewalt 20v DCD771', price: '110 $' },
  { title: 'Dewalt 20V brushless', price: '130 $' },
  { title: 'Dewalt 20 V perceuse', price: '115 $' },
  { title: 'Batterie Milwaukee', price: '60 $' },
];

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mp-eclair-'));
  store = await new Store(path.join(dataDir, 'db.json')).load();
  const notifier = { enabled: true, send: async (m) => { sent.push(m); return true; } };
  app = createApp({ store, ai: fakeAI, notifier, config: { apiToken: TOKEN, dataDir, publicUrl: 'https://mp.example', maxPhotosPerSession: 10 } });
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await fs.rm(dataDir, { recursive: true, force: true });
});

test('choosePrice maps selling modes to strategies and floors', () => {
  const market = { strategies: [{ id: 'fast', price: 95 }, { id: 'market', price: 115 }, { id: 'max', price: 125 }] };
  assert.deepEqual(choosePrice(market, 'balanced'), { price: 115, floorPrice: 95, strategyId: 'market' });
  assert.deepEqual(choosePrice(market, 'max'), { price: 125, floorPrice: 115, strategyId: 'max' });
  assert.deepEqual(choosePrice(market, 'fast'), { price: 95, floorPrice: 80, strategyId: 'fast' });
  assert.equal(choosePrice({ strategies: [] }), null);
  assert.deepEqual(estimateFromRetail({ estimatedRetailPrice: 200, conditionId: 'used_like_new' }), { price: 120, floorPrice: 95, strategyId: 'retail_estimate' });
  assert.equal(estimateFromRetail({ estimatedRetailPrice: null }), null);
});

test('mode éclair: photos → analyzed + written → market → ready, priced and notified', async () => {
  const session = await sessionWithPhotos(2);
  const created = await api('POST', '/api/drafts', { sessionId: session.id, notes: 'batterie neuve', mode: 'balanced', pickupArea: 'Laval' });
  assert.equal(created.status, 201);
  assert.equal(created.body.pipeline.stage, 'analyzing');
  assert.equal((await api('POST', '/api/drafts', { sessionId: session.id })).status, 409, 'same photos twice');

  await app.locals.pipeline.idle();
  let draft = (await api('GET', `/api/listings/${created.body.id}`)).body;
  assert.equal(draft.pipeline.stage, 'awaiting_market');
  assert.equal(draft.title, 'Perceuse DeWalt 20V + batterie');
  assert.equal(draft.categoryId, 'tools');
  assert.equal(draft.item._notes, 'batterie neuve');
  assert.equal(draft.photoUrls.length, 2);

  // AI picked photo #1 as cover: it must now be first.
  const sessionPhotos = (await api('GET', `/api/sessions/${session.id}`)).body.photos;
  assert.equal(draft.photos[0].id, sessionPhotos[1].id);

  const priced = await api('POST', `/api/drafts/${draft.id}/market`, { listings: COMPARABLES });
  assert.equal(priced.status, 200);
  draft = priced.body;
  assert.equal(draft.pipeline.stage, 'ready');
  assert.equal(draft.market.usedCount, 5);
  assert.equal(draft.price, draft.priceOptions.find((o) => o.id === 'market').price);
  assert.equal(draft.floorPrice, draft.priceOptions.find((o) => o.id === 'fast').price);
  assert.ok(draft.ladder.length > 1);
  assert.match(sent.at(-1).title, /prête/);
  assert.equal(sent.at(-1).click, 'https://mp.example/m/lot');

  assert.equal((await api('POST', `/api/drafts/${draft.id}/market`, { listings: [] })).status, 409, 'already priced');
});

test('no comparables → retail-based estimate; no retail either → error, retry works', async () => {
  const s1 = await sessionWithPhotos(1);
  const d1 = (await api('POST', '/api/drafts', { sessionId: s1.id })).body;
  await app.locals.pipeline.idle();
  const est = (await api('POST', `/api/drafts/${d1.id}/market`, { listings: [] })).body;
  assert.equal(est.pipeline.stage, 'ready');
  assert.equal(est.priceSource, 'retail_estimate');
  assert.equal(est.price, 90); // 199 * 0.45

  calls.retail = null;
  const s2 = await sessionWithPhotos(1);
  const d2 = (await api('POST', '/api/drafts', { sessionId: s2.id })).body;
  await app.locals.pipeline.idle();
  const failed = (await api('POST', `/api/drafts/${d2.id}/market`, { listings: [] })).body;
  assert.equal(failed.pipeline.stage, 'error');
  const retried = (await api('POST', `/api/drafts/${d2.id}/retry`)).body;
  assert.equal(retried.pipeline.stage, 'awaiting_market', 'AI work is kept, only the scan is redone');
  calls.retail = 199;
});

test('AI failure marks the draft as error and retry resumes', async () => {
  calls.failNextAnalyze = true;
  const s = await sessionWithPhotos(1);
  const d = (await api('POST', '/api/drafts', { sessionId: s.id })).body;
  await app.locals.pipeline.idle();
  let cur = (await api('GET', `/api/listings/${d.id}`)).body;
  assert.equal(cur.pipeline.stage, 'error');
  assert.match(cur.pipeline.error, /surcharge/);
  await api('POST', `/api/drafts/${d.id}/retry`);
  await app.locals.pipeline.idle();
  cur = (await api('GET', `/api/listings/${d.id}`)).body;
  assert.equal(cur.pipeline.stage, 'awaiting_market');
});

test('inbox sync counts buyers per listing and never lowers manual counts', async () => {
  const l = (await api('POST', '/api/listings', { title: 'Vélo Trek FX 3 taille M', price: 400 })).body;
  await api('PATCH', `/api/listings/${l.id}`, { status: 'active' });
  const res = (await api('POST', '/api/inbox/sync', {
    threads: [
      { listingTitle: 'Vélo Trek FX 3 taille M', buyer: 'Julie', unread: true },
      { listingTitle: 'Vélo Trek FX 3 taille M', buyer: 'Marc' },
      { listingTitle: 'Vélo Trek FX 3 taille M', buyer: 'Julie' },
      { listingTitle: 'Table IKEA', buyer: 'Paul' },
    ],
  })).body;
  assert.equal(res.matched, 1);
  assert.equal(res.updates[0].conversations, 2);
  assert.equal(res.updates[0].unread, 1);
  await api('PATCH', `/api/listings/${l.id}`, { stats: { messages: 5 } });
  await api('POST', '/api/inbox/sync', { threads: [{ listingTitle: 'Vélo Trek FX 3 taille M', buyer: 'Julie' }] });
  assert.equal((await api('GET', `/api/listings/${l.id}`)).body.stats.messages, 5);
});

test('reply from a Messenger thread resolves the listing by title and keeps the floor private', async () => {
  const l = (await api('POST', '/api/listings', { title: 'Kayak Pelican 10 pi', price: 300, floorPrice: 250 })).body;
  await api('PATCH', `/api/listings/${l.id}`, { status: 'active' });
  const r = await api('POST', '/api/reply', {
    listingTitle: 'Kayak Pelican 10 pi',
    history: [{ from: 'buyer', text: 'Encore dispo?' }, { from: 'me', text: 'Oui!' }, { from: 'buyer', text: '200 cash?' }],
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.listingId, l.id);
  assert.equal(calls.lastReply.floorPrice, 250);
  assert.equal(calls.lastReply.history.length, 3);
  assert.equal((await api('POST', '/api/reply', { listingTitle: 'x', history: [{ from: 'me', text: 'hi' }] })).status, 400);
});

test('stats dashboard', async () => {
  const now = new Date('2026-10-20T12:00:00Z');
  const s = computeStats([
    { status: 'sold', postedAt: '2026-10-10T12:00:00Z', soldAt: '2026-10-14T12:00:00Z', price: 100, startPrice: 120, soldPrice: 110 },
    { status: 'sold', postedAt: '2026-09-01T12:00:00Z', soldAt: '2026-09-07T12:00:00Z', price: 50, startPrice: 50 },
    { status: 'active', postedAt: '2026-10-15T12:00:00Z', price: 300 },
    { status: 'draft', pipeline: { stage: 'ready' } },
  ], [{ status: 'done', type: 'renew' }, { status: 'done', type: 'advice' }], now);
  assert.equal(s.revenue, 160);
  assert.equal(s.revenue30d, 110);
  assert.equal(s.soldCount, 2);
  assert.equal(s.avgDaysToSell, 5);
  assert.equal(s.activeValue, 300);
  assert.equal(s.readyCount, 1);
  assert.equal(s.sellThrough, 0.67);
  assert.equal(s.priceRealization, 0.92);
  assert.equal(s.minutesSaved, 3 * 15 + 2);
  const live = (await api('GET', '/api/stats')).body;
  assert.ok(live.draftCount >= 3);
});

test('brute-force protection on the token', async () => {
  let last;
  for (let i = 0; i < 22; i++) {
    last = await fetch(`${base}/api/listings`, { headers: { Authorization: 'Bearer wrong' } });
  }
  assert.equal(last.status, 429);
});
