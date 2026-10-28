// End-to-end check of the Chrome extension against fake Facebook pages and
// the real MarketPilot server (with a stubbed AI).
//
//   cd marketpilot/server && npm install
//   npm i -D playwright   (anywhere on the NODE_PATH)
//   node ../tools/e2e-extension.mjs
//
// Facebook's markup is approximated with the same accessibility hooks the
// content scripts rely on (aria-labels, roles, visible text).

import { chromium } from 'playwright';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import { execFileSync } from 'node:child_process';
import { Store } from '../server/src/store.js';
import { createApp } from '../server/src/app.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.join(here, '..', 'extension');
const TOKEN = 'e2e-token-0123456789abcdef';
const SHOTS = process.env.SHOTS_DIR || null;

// ------------------------------------------------------------ fake FB
const page = (body, script = '') => `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}<script>${script}</script></body></html>`;

const SEARCH = page([
  ['100 $', 'Perceuse DeWalt 20V', 'Laval, QC'],
  ['120 $', 'DeWalt 20V drill + batterie', 'Montréal, QC'],
  ['110 $\n140 $', 'Dewalt DCD771 20V', 'Longueuil, QC'],
  ['60 $', 'Batterie Milwaukee M18', 'Laval, QC'],
].map(([p, t, l], i) => `<a href="/marketplace/item/10${i}/"><img src="x.jpg"><div>${p.split('\n').map((x) => `<span>${x}</span>`).join('<br>')}</div><div>${t}</div><div>${l}</div></a>`).join(''));

const FORM_SCRIPT = `
  window.__state = { photos: 0, submitted: false };
  const bind = (sel, key) => document.querySelector(sel).addEventListener('input', (e) => { window.__state[key] = e.target.value; });
  bind('[aria-label=Titre] input', 'title');
  bind('[aria-label=Prix] input', 'price');
  bind('[aria-label=Description] textarea', 'description');
  document.querySelector('input[type=file]').addEventListener('change', (e) => { window.__state.photos = e.target.files.length; });
  for (const combo of document.querySelectorAll('[role=combobox]')) {
    combo.addEventListener('click', () => {
      document.querySelectorAll('[role=listbox]').forEach((l) => l.remove());
      const list = document.createElement('div');
      list.setAttribute('role', 'listbox');
      for (const opt of combo.dataset.options.split('|')) {
        const o = document.createElement('div');
        o.setAttribute('role', 'option');
        o.textContent = opt;
        o.addEventListener('click', () => { window.__state[combo.dataset.key] = opt; combo.querySelector('span').textContent = opt; list.remove(); });
        list.append(o);
      }
      document.body.append(list);
    });
  }
  document.querySelector('#submit').addEventListener('click', () => { window.__state.submitted = true; });
`;
const form = (submitLabel) => page(`
  <input type="file" accept="image/*,image/heif,image/heic" multiple>
  <label aria-label="Titre"><span>Titre</span><input type="text"></label>
  <label aria-label="Prix"><span>Prix</span><input type="text"></label>
  <label role="combobox" aria-label="Catégorie" tabindex="0" data-key="category" data-options="Outils|Meubles|Électronique et ordinateurs"><span>Catégorie</span></label>
  <label role="combobox" aria-label="État" tabindex="0" data-key="condition" data-options="Neuf|Usagé – comme neuf|Usagé – bon état|Usagé – état passable"><span>État</span></label>
  <label aria-label="Description"><span>Description</span><textarea></textarea></label>
  <div role="button" id="submit" aria-label="${submitLabel}">${submitLabel}</div>`, FORM_SCRIPT);

const SELLING = page(`
  <div class="card">
    <a href="/marketplace/item/555/"><img src="x.jpg"></a>
    <span>Perceuse DeWalt 20V</span><br><span>120 $</span><br><span>12 clics sur l’annonce</span><br>
    <div role="button" aria-label="Marquer comme vendu">Marquer comme vendu</div>
    <div role="button" id="renew" aria-label="Renouveler l’annonce">Renouveler l’annonce</div>
  </div>`, "window.__renewed = 0; document.getElementById('renew').addEventListener('click', () => { window.__renewed++; });");

const INBOX = page(`
  <div role="main">
    <div role="row" aria-label="Conversation non lue"><span>Julie · Perceuse DeWalt 20V</span><br><span style="font-weight:700">Encore disponible?</span></div>
    <div role="row"><span>Marc · Perceuse DeWalt 20V</span><br><span>Ok merci</span></div>
    <div role="row"><span>Paul · Article inconnu</span><br><span>Salut</span></div>
  </div>`);

const THREAD = page(`
  <div role="main" style="width:800px">
    <a href="/marketplace/item/555/"><h2>Julie · Perceuse DeWalt 20V</h2></a>
    <div role="row"><div dir="auto" style="width:200px">Bonjour, encore disponible?</div></div>
    <div role="row"><div dir="auto" style="width:200px;margin-left:560px">Oui!</div></div>
    <div role="row"><div dir="auto" style="width:200px">Je peux offrir 60 $ cash ce soir</div></div>
    <div role="textbox" contenteditable="true" style="min-height:30px;border:1px solid #ccc"></div>
  </div>`);

function fakeFacebook(url) {
  const { pathname } = new URL(url);
  if (pathname.startsWith('/marketplace/inbox')) return INBOX;
  if (pathname.startsWith('/marketplace/t/')) return THREAD;
  if (pathname.includes('/search')) return SEARCH;
  if (pathname.startsWith('/marketplace/create')) return form('Publier');
  if (pathname.startsWith('/marketplace/edit')) return form('Mettre à jour');
  if (pathname.startsWith('/marketplace/you/selling')) return SELLING;
  return page('<p>facebook</p>');
}

// ------------------------------------------------------------ fake AI
let lastReply = null;
const fakeAI = {
  analyzeItem: async () => ({ itemName: 'Perceuse DeWalt 20V', brand: 'DeWalt', model: 'DCD771', categoryId: 'tools', conditionId: 'used_good', conditionNotes: '', keyAttributes: [], searchQueries: ['dewalt 20v'], estimatedRetailPrice: 199, coverPhotoIndex: 0, photoTips: [], policyWarnings: [] }),
  writeListing: async () => ({ title: 'Visseuse DeWalt DCD771 avec chargeur', description: 'Fonctionne parfaitement. Prix discutable.', alternateTitles: [] }),
  matchComparables: async ({ comparables }) => ({ matches: comparables.map((c, index) => ({ index, match: /dewalt/i.test(c.title) ? 'identical' : 'different' })) }),
  draftReply: async (input) => { lastReply = input; return { reply: 'Je peux descendre à 100 $, ce soir 19 h?', intent: 'lowball', scamSignals: [] }; },
};

// --------------------------------------------------------------- run
const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mp-e2e-'));
const store = await new Store(path.join(dataDir, 'db.json')).load();
const app = createApp({ store, ai: fakeAI, notifier: null, config: { apiToken: TOKEN, dataDir, publicUrl: 'http://127.0.0.1', maxPhotosPerSession: 10, localPairing: true } });
const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
const serverUrl = `http://127.0.0.1:${server.address().port}`;

// Tabs opened by the extension bypass Playwright's request routing, so the
// fake Facebook is a real HTTPS server and www.facebook.com resolves to it.
const certDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mp-cert-'));
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=www.facebook.com',
  '-keyout', path.join(certDir, 'key.pem'), '-out', path.join(certDir, 'cert.pem')], { stdio: 'ignore' });
const fbServer = https.createServer({ key: await fs.readFile(path.join(certDir, 'key.pem')), cert: await fs.readFile(path.join(certDir, 'cert.pem')) },
  (req, res) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(fakeFacebook(`https://www.facebook.com${req.url}`)); });
await new Promise((resolve) => fbServer.listen(0, '127.0.0.1', resolve));

const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mp-chrome-'));
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: [
    `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`,
    `--host-resolver-rules=MAP www.facebook.com 127.0.0.1:${fbServer.address().port}`,
    '--ignore-certificate-errors', '--no-proxy-server',
  ],
});
const pageErrors = [];
context.on('page', (p) => p.on('pageerror', (e) => pageErrors.push(`${p.url()}: ${e.message}`)));

const isOurs = (w) => w.url().endsWith('/background.js');
const worker = context.serviceWorkers().find(isOurs) || await context.waitForEvent('serviceworker', { predicate: isOurs });
const extId = new URL(worker.url()).host;
const panel = await context.newPage();
panel.on('pageerror', (e) => pageErrors.push(`panel: ${e.message}`));
await panel.goto(`chrome-extension://${extId}/sidepanel/index.html`);
// Extension APIs aren't reliably bound in the worker's evaluate context; use the panel page.
// No token given: the panel must pair with the local server by itself.
await panel.evaluate(async (s) => chrome.storage.local.set({ settings: s }), { serverUrl, autoExecute: false, autoSubmit: false, citySlug: 'laval' });
await panel.reload();
await panel.waitForFunction(async () => (await chrome.storage.local.get('settings')).settings?.token, null, { timeout: 10000 });
assert.equal(await panel.evaluate(async () => (await chrome.storage.local.get('settings')).settings.token), TOKEN);
assert.match(await panel.textContent('#flash'), /Connecté automatiquement/);
console.log('✔ jumelage automatique : l’extension a trouvé le serveur et son jeton toute seule');
const send = (msg) => panel.evaluate((m) => chrome.runtime.sendMessage(m), msg);
const apiCall = async (method, url, body) => {
  const res = await fetch(`${serverUrl}${url}`, { method, headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  return res.json();
};
const step = (name) => console.log(`✔ ${name}`);

// 1. Market scan reads search results (incl. reduced price) and prices them.
const scan = await send({ type: 'mp:marketScan', queries: ['dewalt 20v'] });
assert.ok(scan.ok, scan.error);
assert.equal(scan.result.length, 4);
const reduced = scan.result.find((r) => r.id === '102');
assert.equal(reduced.price, '110 $');
assert.equal(reduced.title, 'Dewalt DCD771 20V');
assert.equal(reduced.location, 'Longueuil, QC');
const pricing = await apiCall('POST', '/api/pricing', { item: { itemName: 'Perceuse DeWalt 20V', searchQueries: ['dewalt 20v'] }, listings: scan.result });
assert.equal(pricing.usedCount, 3);
step(`market scan: ${scan.result.length} annonces, médiane ${pricing.stats.median} $`);

// 2. Create listing with a photo, fill the Facebook form.
const session = await apiCall('POST', '/api/sessions');
const uploadToken = new URL(session.mobileUrl).hash.slice(3);
const fd = new FormData();
fd.append('photos', new Blob([Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64')], { type: 'image/jpeg' }), 'p.jpg');
await fetch(`${serverUrl}/m/api/sessions/${session.id}/photos`, { method: 'POST', headers: { 'x-upload-token': uploadToken }, body: fd });
const listing = await apiCall('POST', '/api/listings', { title: 'Perceuse DeWalt 20V', description: 'Fonctionne parfaitement.\nRamassage à Laval.', price: 120, floorPrice: 90, categoryId: 'tools', conditionId: 'used_good', sessionId: session.id, item: { brand: 'DeWalt' } });

const createTab = context.waitForEvent('page', (p) => p.url().includes('/marketplace/create'));
const filled = await send({ type: 'mp:openCreate', listingId: listing.id });
assert.ok(filled.ok, filled.error);
assert.deepEqual(filled.result.missing, []);
const fb = await createTab;
const state = await fb.evaluate(() => window.__state);
assert.equal(state.title, 'Perceuse DeWalt 20V');
assert.equal(state.price, '120');
assert.equal(state.category, 'Outils');
assert.equal(state.condition, 'Usagé – bon état');
assert.match(state.description, /Ramassage à Laval/);
assert.equal(state.photos, 1);
assert.equal(state.submitted, false, 'never publishes without the user');
if (SHOTS) await fb.screenshot({ path: path.join(SHOTS, 'fb-create-filled.png') });
await fb.click('#submit'); // the user reviews and clicks "Publier"
await fb.waitForTimeout(800);
assert.equal((await apiCall('GET', `/api/listings/${listing.id}`)).status, 'active');
await fb.close();
step('formulaire Marketplace rempli (photos, titre, prix, catégorie, état, description) — publication par l’utilisateur');

// 3. Sync from "Vos annonces" links the Facebook id and clicks.
const sync = await send({ type: 'mp:syncNow' });
assert.ok(sync.ok, sync.error);
let current = await apiCall('GET', `/api/listings/${listing.id}`);
assert.equal(current.fbId, '555');
assert.equal(current.stats.views, 12);
step('synchronisation « Vos annonces » : id Facebook 555, 12 clics');

// 4. Strategy: 8 days old → renew (auto-approved) + price drop (needs approval).
await store.update('listings', listing.id, { postedAt: new Date(Date.now() - 8 * 86400000).toISOString() });
const { created } = await apiCall('POST', '/api/strategy/run');
const renew = created.find((a) => a.type === 'renew');
const drop = created.find((a) => a.type === 'price_drop');
assert.equal(renew.status, 'approved');
assert.equal(drop.status, 'pending');

const renewRun = await send({ type: 'mp:runActions', actionId: renew.id });
assert.ok(renewRun.ok && renewRun.result[0].ok, JSON.stringify(renewRun));
assert.equal((await apiCall('GET', '/api/actions?status=done')).find((a) => a.id === renew.id)?.status, 'done');
step('relance exécutée sur « Vos annonces »');

// 5. Approve a custom price drop, the edit form opens pre-filled, user confirms.
await apiCall('POST', `/api/actions/${drop.id}/approve`, { price: 105 });
const editTab = context.waitForEvent('page', (p) => p.url().includes('/marketplace/edit'));
const dropRun = await send({ type: 'mp:runActions', actionId: drop.id });
assert.ok(dropRun.ok, dropRun.error);
const edit = await editTab;
assert.match(edit.url(), /listing_id=555/);
await edit.waitForFunction(() => window.__state?.price === '105');
await edit.click('#submit');
await edit.waitForTimeout(800);
current = await apiCall('GET', `/api/listings/${listing.id}`);
assert.equal(current.price, 105);
step('baisse de prix approuvée (120 $ → 105 $) appliquée après confirmation');

// 6. Mode éclair: phone photos → AI → background market scan → ready → publish from the queue.
const s2 = await apiCall('POST', '/api/sessions');
const fd2 = new FormData();
fd2.append('photos', new Blob([Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64')], { type: 'image/jpeg' }), 'p.jpg');
await fetch(`${serverUrl}/m/api/sessions/${s2.id}/photos`, { method: 'POST', headers: { 'x-upload-token': new URL(s2.mobileUrl).hash.slice(3) }, body: fd2 });
const eclair = await apiCall('POST', '/api/drafts', { sessionId: s2.id, mode: 'balanced' });
await app.locals.pipeline.idle();
assert.equal((await apiCall('GET', `/api/listings/${eclair.id}`)).pipeline.stage, 'awaiting_market');
const q = await send({ type: 'mp:processQueue' });
assert.ok(q.ok, q.error);
assert.equal(q.result.processed, 1);
let ready = await apiCall('GET', `/api/listings/${eclair.id}`);
assert.equal(ready.pipeline.stage, 'ready');
assert.equal(ready.price, 110);
await panel.reload();
await panel.waitForSelector(`.qcard[data-id="${eclair.id}"] .qstage.ready`);
assert.match(await panel.textContent('#publish-all'), /Tout publier \(1\)/);
if (SHOTS) await panel.setViewportSize({ width: 400, height: 800 }), await panel.waitForTimeout(500), await panel.screenshot({ path: path.join(SHOTS, 'panel-eclair.png'), fullPage: true });
const eclairTab = context.waitForEvent('page', (p) => p.url().includes('/marketplace/create'));
await panel.click(`.qcard[data-id="${eclair.id}"] [data-act=publish]`);
const fb2 = await eclairTab;
await fb2.waitForFunction(() => window.__state?.description?.includes('Prix discutable'));
assert.equal(await fb2.evaluate(() => window.__state.price), '110');
await fb2.click('#submit');
await fb2.waitForTimeout(800);
assert.equal((await apiCall('GET', `/api/listings/${eclair.id}`)).status, 'active');
await fb2.close();
step('mode éclair : photo → IA → scan du marché automatique → 110 $ → publié depuis la file');

// 7. Inbox: buyers counted per listing (feeds "don't drop the price while buyers talk").
const sync2 = await send({ type: 'mp:syncNow' });
assert.ok(sync2.ok, sync2.error);
current = await apiCall('GET', `/api/listings/${listing.id}`);
assert.equal(current.stats.messages, 2);
assert.equal(current.stats.unread, 1);
step('boîte de réception : 2 acheteurs, 1 non lu sur la perceuse');

// 8. Messenger thread: ✨ button drafts a reply from the whole conversation into the composer.
const thread = await context.newPage();
thread.on('pageerror', (e) => pageErrors.push(`thread: ${e.message}`));
await thread.goto('https://www.facebook.com/marketplace/t/123/');
await thread.waitForSelector('#mp-reply-btn', { timeout: 15000 });
await thread.click('#mp-reply-btn');
await thread.waitForFunction(() => document.querySelector('[role=textbox]').textContent.includes('100 $'));
assert.deepEqual(lastReply.history.map((m) => m.from), ['buyer', 'me', 'buyer']);
assert.equal(lastReply.floorPrice, 90, 'listing resolved from the item link → private floor used');
if (SHOTS) await thread.screenshot({ path: path.join(SHOTS, 'thread-reply.png') });
await thread.close();
step('Messenger : réponse IA insérée (contre-offre au-dessus du plancher), jamais envoyée seule');

// 9. Side panel renders the listing, dashboard and decisions without errors.
await panel.reload();
await panel.click('[data-tab=listings]');
await panel.waitForSelector('#listings .card');
await panel.waitForSelector('#dashboard .tile.hero');
assert.match(await panel.textContent('#listings'), /Perceuse DeWalt 20V/);
if (SHOTS) await panel.setViewportSize({ width: 400, height: 800 }), await panel.screenshot({ path: path.join(SHOTS, 'panel-listings.png'), fullPage: true });
await panel.click('[data-tab=create]');
if (SHOTS) await panel.screenshot({ path: path.join(SHOTS, 'panel-create.png'), fullPage: true });
step('panneau latéral OK');

assert.deepEqual(pageErrors, [], pageErrors.join('\n'));
await context.close();
server.close();
fbServer.close();
await fs.rm(certDir, { recursive: true, force: true });
await fs.rm(dataDir, { recursive: true, force: true });
await fs.rm(userDataDir, { recursive: true, force: true });
console.log('\nTous les tests E2E de l’extension passent.');
