// Background service worker: market scans, form filling and execution of
// approved strategy actions (renew, price drop, relist, boost).

import { api, getSettings, photoDataUrl } from './lib/api.js';

const FB = 'https://www.facebook.com';
const ACTION_ALARM = 'mp-actions';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  chrome.alarms.create(ACTION_ALARM, { periodInMinutes: 15, delayInMinutes: 1 });
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ACTION_ALARM, { periodInMinutes: 15, delayInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ACTION_ALARM) return;
  await refreshBadge();
  const { autoExecute } = await getSettings();
  if (autoExecute) await runApprovedActions().catch((err) => console.warn('[MarketPilot]', err));
});

// ------------------------------------------------------------------ tabs

function waitForComplete(tabId, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error('Chargement Facebook trop long')); }, timeout);
    const listener = (id, info) => { if (id === tabId && info.status === 'complete') { cleanup(); resolve(); } };
    const cleanup = () => { clearTimeout(timer); chrome.tabs.onUpdated.removeListener(listener); };
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId).then((t) => { if (t.status === 'complete') { cleanup(); resolve(); } }).catch(() => {});
  });
}

async function sendToTab(tabId, message, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await chrome.tabs.sendMessage(tabId, message);
      if (res !== undefined) return res;
    } catch { /* content script not ready yet */ }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error('La page Facebook ne répond pas (es-tu connecté à Facebook ?)');
}

async function withTab(url, { active = false, keepOpen = false } = {}, fn) {
  const tab = await chrome.tabs.create({ url, active });
  try {
    await waitForComplete(tab.id);
    return await fn(tab);
  } finally {
    if (!keepOpen) chrome.tabs.remove(tab.id).catch(() => {});
  }
}

// --------------------------------------------------------- market scan

async function marketScan({ queries, maxPerQuery = 60 }) {
  const { citySlug } = await getSettings();
  const base = citySlug ? `${FB}/marketplace/${encodeURIComponent(citySlug)}/search` : `${FB}/marketplace/search`;
  const all = [];
  for (const query of queries.slice(0, 3)) {
    const url = `${base}?query=${encodeURIComponent(query)}&exact=false`;
    const res = await withTab(url, {}, (tab) => sendToTab(tab.id, { type: 'mp:scrapeSearch', options: { scrolls: 3, max: maxPerQuery } }));
    if (!res?.ok) throw new Error(res?.error || 'Lecture des résultats impossible');
    all.push(...res.items.map((i) => ({ ...i, query })));
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500)); // be gentle
  }
  const unique = new Map(all.map((i) => [i.id, i]));
  return [...unique.values()];
}

// -------------------------------------------------------- form filling

async function buildFormData(listing, overrides = {}) {
  const { categories, conditions } = await api('/api/meta');
  const photos = [];
  for (const [i, p] of (overrides.photos || listing.photos || []).entries()) {
    photos.push({ dataUrl: await photoDataUrl(p.sessionId, p.id), name: `photo-${i + 1}.jpg` });
  }
  return {
    title: overrides.title || listing.title,
    price: overrides.price ?? listing.price,
    description: listing.description,
    category: categories.find((c) => c.id === listing.categoryId),
    condition: conditions.find((c) => c.id === listing.conditionId),
    brand: listing.item?.brand || '',
    photos,
  };
}

async function openCreate(listingId, { actionId, overrides } = {}) {
  const listing = await api(`/api/listings/${listingId}`);
  const { autoSubmit } = await getSettings();
  const data = { ...(await buildFormData(listing, overrides)), mode: 'create', autoSubmit, actionId, listingId };
  return withTab(`${FB}/marketplace/create/item`, { active: !autoSubmit, keepOpen: !autoSubmit }, async (tab) => {
    const res = await sendToTab(tab.id, { type: 'mp:fill', data });
    if (!res?.ok) throw new Error(res?.error || 'Remplissage impossible');
    return res.report;
  });
}

async function openEdit(listing, { price, actionId }) {
  if (!listing.fbId) throw new Error('Annonce pas encore liée à Facebook — ouvre « Vos annonces » pour synchroniser.');
  const { autoSubmit } = await getSettings();
  const data = { mode: 'edit', price, autoSubmit, actionId, listingId: listing.id };
  return withTab(`${FB}/marketplace/edit/?listing_id=${listing.fbId}`, { active: !autoSubmit, keepOpen: !autoSubmit }, async (tab) => {
    const res = await sendToTab(tab.id, { type: 'mp:fill', data });
    if (!res?.ok) throw new Error(res?.error || 'Modification impossible');
    return res.report;
  });
}

async function sellingAction(action, listing) {
  // Boost needs the user (payment), so the tab stays open and in front.
  const interactive = action === 'boost';
  return withTab(`${FB}/marketplace/you/selling`, { active: interactive, keepOpen: interactive }, async (tab) => {
    const res = await sendToTab(tab.id, { type: 'mp:sellingAction', action, fbId: listing.fbId, title: listing.title });
    if (!res?.ok) throw new Error(res?.error || 'Action impossible');
    return res;
  });
}

async function syncSelling() {
  return withTab(`${FB}/marketplace/you/selling`, {}, async (tab) => {
    const res = await sendToTab(tab.id, { type: 'mp:scrapeSelling' });
    if (!res?.ok) throw new Error('Lecture de « Vos annonces » impossible');
    return api('/api/listings/sync', { method: 'POST', body: { items: res.items } });
  });
}

// ------------------------------------------------------------- actions

let running = null;

async function executeAction(action) {
  const listing = await api(`/api/listings/${action.listingId}`);
  switch (action.type) {
    case 'renew':
      await sellingAction('renew', listing);
      return { done: true };
    case 'boost':
      await sellingAction('boost', listing);
      return { done: true, note: 'Boost ouvert — confirme le budget et le paiement dans Facebook.' };
    case 'price_drop': {
      const report = await openEdit(listing, { price: action.payload.to, actionId: action.id });
      return { done: report.submitted, report };
    }
    case 'relist': {
      const report = await openCreate(listing.id, { actionId: action.id, overrides: { title: action.payload.title, photos: action.payload.photos } });
      return { done: report.submitted, report, note: 'Supprime l’ancienne annonce après publication pour éviter un doublon.' };
    }
    default:
      return { done: false };
  }
}

async function runApprovedActions({ actionId, force = false } = {}) {
  if (running) return running;
  running = (async () => {
    const results = [];
    const actions = await api('/api/actions?status=approved');
    const now = Date.now();
    for (const action of actions) {
      if (actionId && action.id !== actionId) continue;
      if (!force && new Date(action.scheduledFor).getTime() > now) continue;
      if (!action.listing || ['sold', 'archived'].includes(action.listing.status)) continue;
      try {
        const outcome = await executeAction(action);
        // Actions waiting for your click are completed by the mp:submitted message.
        if (outcome.done) await api(`/api/actions/${action.id}/complete`, { method: 'POST', body: { result: { note: outcome.note } } });
        results.push({ id: action.id, ok: true, ...outcome });
        notify(`${labelOf(action)} : ${action.listing.title}`, outcome.done ? (outcome.note || 'Fait ✅') : 'Vérifie l’onglet Facebook et confirme.');
      } catch (err) {
        await api(`/api/actions/${action.id}/fail`, { method: 'POST', body: { error: err.message } }).catch(() => {});
        results.push({ id: action.id, ok: false, error: err.message });
        notify(`Échec — ${labelOf(action)}`, err.message);
      }
    }
    await refreshBadge();
    return results;
  })().finally(() => { running = null; });
  return running;
}

const labelOf = (a) => ({ renew: 'Relance', price_drop: 'Baisse de prix', relist: 'Republication', boost: 'Boost' }[a.type] || a.type);

function notify(title, message) {
  chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon128.png', title, message, priority: 1 });
}

async function refreshBadge() {
  try {
    const pending = await api('/api/actions?status=pending');
    await chrome.action.setBadgeText({ text: pending.length ? String(pending.length) : '' });
    await chrome.action.setBadgeBackgroundColor({ color: '#e41e3f' });
  } catch {
    await chrome.action.setBadgeText({ text: '' });
  }
}

// ------------------------------------------------------------ messages

const handlers = {
  'mp:marketScan': (msg) => marketScan(msg),
  'mp:openCreate': (msg) => openCreate(msg.listingId),
  'mp:runActions': (msg) => runApprovedActions({ actionId: msg.actionId, force: true }),
  'mp:syncNow': () => syncSelling(),
  'mp:refreshBadge': () => refreshBadge(),
  // From content scripts:
  'mp:syncSelling': (msg) => api('/api/listings/sync', { method: 'POST', body: { items: msg.items } }),
  'mp:submitted': async (msg) => {
    if (msg.actionId) {
      await api(`/api/actions/${msg.actionId}/complete`, { method: 'POST', body: { result: { confirmedByUser: true } } });
    } else if (msg.listingId) {
      await api(`/api/listings/${msg.listingId}`, { method: 'PATCH', body: { status: 'active' } });
    }
    await refreshBadge();
    return { ok: true };
  },
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const handler = handlers[msg?.type];
  if (!handler) return;
  Promise.resolve(handler(msg))
    .then((result) => sendResponse({ ok: true, result }))
    .catch((err) => sendResponse({ ok: false, error: err.message }));
  return true;
});
