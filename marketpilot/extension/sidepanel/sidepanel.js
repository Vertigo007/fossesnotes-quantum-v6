import { api, getSettings, saveSettings } from '../lib/api.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (v) => (v == null ? '—' : `${Math.round(v * 100) / 100} $`);

let meta = null;
let draft = {}; // current listing being created, persisted across panel reloads
const blobCache = new Map();

// ---------------------------------------------------------------- utils

function flash(message, kind = 'info', ms = 5000) {
  const el = $('flash');
  el.textContent = message;
  el.className = `flash ${kind}`;
  el.hidden = false;
  clearTimeout(flash.t);
  if (ms) flash.t = setTimeout(() => { el.hidden = true; }, ms);
}

async function busy(button, fn) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = '…';
  try {
    return await fn();
  } catch (err) {
    flash(err.message, 'error', 8000);
    return undefined;
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

async function bg(type, payload = {}) {
  const res = await chrome.runtime.sendMessage({ type, ...payload });
  if (!res?.ok) throw new Error(res?.error || 'Erreur de l’extension');
  return res.result;
}

const saveDraft = () => chrome.storage.local.set({ draft });

function nicePrice(value) {
  if (!(value > 0)) return 0;
  const step = value < 20 ? 1 : value < 1000 ? 5 : value < 5000 ? 25 : 50;
  return Math.max(step, Math.round(value / step) * step);
}

async function photoUrl(photo) {
  if (blobCache.has(photo.id)) return blobCache.get(photo.id);
  const res = await api(photo.url, { raw: true });
  const url = URL.createObjectURL(await res.blob());
  blobCache.set(photo.id, url);
  return url;
}

// ----------------------------------------------------------------- tabs

function showTab(name) {
  for (const btn of document.querySelectorAll('[role=tab]')) btn.setAttribute('aria-selected', String(btn.dataset.tab === name));
  for (const sec of document.querySelectorAll('.tab')) sec.hidden = sec.id !== `tab-${name}`;
  if (name === 'listings') loadListings();
  if (name === 'decisions') loadDecisions();
  if (name === 'settings') loadSettings();
}
document.querySelector('.tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('[role=tab]');
  if (btn) showTab(btn.dataset.tab);
});

// ========================================================= 1. PHOTOS

$('new-session').addEventListener('click', (e) => busy(e.currentTarget, async () => {
  if (draft.sessionId && !confirm('Commencer une nouvelle annonce ? Le brouillon actuel sera effacé.')) return;
  const session = await api('/api/sessions', { method: 'POST' });
  draft = { sessionId: session.id, mobileUrl: session.mobileUrl, qrSvg: session.qrSvg, photos: [] };
  await saveDraft();
  renderCreate();
}));

$('local-files').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  e.target.value = '';
  if (!files.length) return;
  const { serverUrl } = await getSettings();
  const token = new URL(draft.mobileUrl).hash.replace('#t=', '');
  const form = new FormData();
  for (const f of files) form.append('photos', f, f.name);
  const res = await fetch(`${serverUrl}/m/api/sessions/${draft.sessionId}/photos`, { method: 'POST', headers: { 'x-upload-token': token }, body: form });
  if (!res.ok) flash((await res.json().catch(() => ({}))).error || 'Échec du téléversement', 'error');
  pollSession();
});

async function pollSession() {
  if (!draft.sessionId) return;
  try {
    const session = await api(`/api/sessions/${draft.sessionId}`);
    const changed = session.photos.map((p) => p.id).join() !== (draft.photos || []).map((p) => p.id).join();
    if (changed) {
      draft.photos = session.photos;
      await saveDraft();
      renderPhotos();
    }
  } catch { /* server offline: keep polling quietly */ }
}
setInterval(() => { if (!$('tab-create').hidden && !document.hidden) pollSession(); }, 2500);

async function renderPhotos() {
  const list = $('photos');
  list.innerHTML = '';
  for (const p of draft.photos || []) {
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.id = p.id;
    li.innerHTML = `<img alt=""><button class="del" title="Retirer">×</button>`;
    photoUrl(p).then((url) => { li.querySelector('img').src = url; }).catch(() => {});
    list.append(li);
  }
  $('step-analyze').hidden = !(draft.photos || []).length;
}

$('photos').addEventListener('click', async (e) => {
  const del = e.target.closest('.del');
  if (!del) return;
  const id = del.parentElement.dataset.id;
  const session = await api(`/api/sessions/${draft.sessionId}/photos/${id}`, { method: 'DELETE' });
  draft.photos = session.photos;
  await saveDraft();
  renderPhotos();
});

let dragged = null;
$('photos').addEventListener('dragstart', (e) => { dragged = e.target.closest('li'); });
$('photos').addEventListener('dragover', (e) => {
  e.preventDefault();
  const over = e.target.closest('li');
  if (!dragged || !over || over === dragged) return;
  const rect = over.getBoundingClientRect();
  over.parentElement.insertBefore(dragged, e.clientX < rect.left + rect.width / 2 ? over : over.nextSibling);
});
$('photos').addEventListener('drop', async (e) => {
  e.preventDefault();
  const photoIds = [...$('photos').children].map((li) => li.dataset.id);
  const session = await api(`/api/sessions/${draft.sessionId}/order`, { method: 'POST', body: { photoIds } });
  draft.photos = session.photos;
  await saveDraft();
});

// ========================================================= 2. ANALYZE

$('analyze').addEventListener('click', (e) => busy(e.currentTarget, async () => {
  const { item } = await api('/api/analyze', { method: 'POST', body: { sessionId: draft.sessionId, notes: $('notes').value } });
  draft.item = item;
  draft.notes = $('notes').value;
  // Put the AI's preferred cover photo first.
  if (item.coverPhotoIndex > 0 && draft.photos[item.coverPhotoIndex]) {
    const ids = draft.photos.map((p) => p.id);
    ids.unshift(...ids.splice(item.coverPhotoIndex, 1));
    draft.photos = (await api(`/api/sessions/${draft.sessionId}/order`, { method: 'POST', body: { photoIds: ids } })).photos;
  }
  draft.queries = item.searchQueries.slice(0, 3).join(' ; ');
  await saveDraft();
  renderCreate();
}));

function renderItem() {
  const item = draft.item;
  $('item').hidden = !item;
  $('step-market').hidden = !item;
  if (!item) return;
  $('item-name').value = item.itemName;
  $('category').innerHTML = meta.categories.map((c) => `<option value="${c.id}">${esc(c.fr)}</option>`).join('');
  $('condition').innerHTML = meta.conditions.map((c) => `<option value="${c.id}">${esc(c.fr)}</option>`).join('');
  $('category').value = item.categoryId;
  $('condition').value = item.conditionId;
  const bits = [];
  if (item.brand || item.model) bits.push(`<b>${esc([item.brand, item.model].filter(Boolean).join(' '))}</b>`);
  if (item.keyAttributes?.length) bits.push(item.keyAttributes.map((a) => `${esc(a.name)} : ${esc(a.value)}`).join(' · '));
  if (item.conditionNotes) bits.push(`État : ${esc(item.conditionNotes)}`);
  if (item.estimatedRetailPrice) bits.push(`Prix neuf estimé : ${money(item.estimatedRetailPrice)}`);
  if (item.photoTips?.length) bits.push(`📸 ${item.photoTips.map(esc).join(' · ')}`);
  if (item.policyWarnings?.length) bits.push(`<span class="warn">⚠️ ${item.policyWarnings.map(esc).join(' · ')}</span>`);
  $('item-extra').innerHTML = bits.map((b) => `<p>${b}</p>`).join('');
  $('queries').value = draft.queries || '';
}

for (const id of ['item-name', 'category', 'condition']) {
  $(id).addEventListener('change', () => {
    if (!draft.item) return;
    draft.item.itemName = $('item-name').value;
    draft.item.categoryId = $('category').value;
    draft.item.conditionId = $('condition').value;
    saveDraft();
  });
}

// ========================================================== 3. MARKET

$('scan').addEventListener('click', (e) => busy(e.currentTarget, async () => {
  const queries = $('queries').value.split(';').map((q) => q.trim()).filter(Boolean);
  if (!queries.length) throw new Error('Ajoute au moins une recherche.');
  draft.queries = $('queries').value;
  flash('Lecture de Marketplace en arrière-plan… (≈ 20 s)', 'info', 0);
  const listings = await bg('mp:marketScan', { queries });
  flash(`${listings.length} annonces lues. Comparaison par l’IA…`, 'info', 0);
  draft.market = await api('/api/pricing', {
    method: 'POST',
    body: { item: { ...draft.item, searchQueries: queries }, listings, desiredPrice: Number($('price').value) || null },
  });
  $('flash').hidden = true;
  const market = draft.market.strategies.find((s) => s.id === 'market');
  if (market && !$('price').value) setPrice(market.price, draft.market.strategies.find((s) => s.id === 'fast')?.price);
  await saveDraft();
  renderMarket();
}));

function setPrice(price, floor) {
  $('price').value = price;
  if (floor != null && (!$('floor').value || Number($('floor').value) > price)) $('floor').value = Math.min(floor, price);
  draft.price = Number($('price').value);
  draft.floor = Number($('floor').value);
  saveDraft();
  renderDesired();
  renderLadder();
}

function renderMarket() {
  const m = draft.market;
  $('market').hidden = !m;
  if (!m) return;
  if (!m.stats) {
    $('market-stats').innerHTML = `<p class="muted small">Pas assez d’annonces comparables (${m.totalScanned} lues). Essaie une recherche plus large.</p>`;
    $('strategies').innerHTML = '';
    return;
  }
  $('market-stats').innerHTML = [
    ['Bas', m.stats.p25], ['Médian', m.stats.median], ['Haut', m.stats.p75],
  ].map(([k, v]) => `<div class="stat"><b>${money(v)}</b><span>${k}</span></div>`).join('')
    + `<p class="muted small" style="grid-column:1/-1;margin:0">${m.usedCount} comparables (${m.identicalCount} identiques) · confiance ${esc(m.confidence)}</p>`;
  $('strategies').innerHTML = m.strategies.map((s) => `
    <button class="strategy ${Number($('price').value) === s.price ? 'selected' : ''}" data-price="${s.price}" data-margin="${s.listWithMargin}">
      <b>${money(s.price)}</b> — ${esc(s.label)}<br>
      <span class="muted">${esc(s.description)} ${s.daysToSell ? `Vente estimée : ${s.daysToSell.min}–${s.daysToSell.max} jours.` : ''}</span>
    </button>`).join('');
  $('comparables').innerHTML = m.comparables.map((c) => `
    <li><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)}</a> — <b>${money(c.price)}</b>
      <span class="sim">${c.similarity >= 0.8 ? 'identique' : 'similaire'}${c.location ? ` · ${esc(c.location)}` : ''}</span></li>`).join('');
}

$('strategies').addEventListener('click', (e) => {
  const btn = e.target.closest('.strategy');
  if (!btn) return;
  const negotiable = $('negotiable').checked;
  // With negotiation, list a bit higher and keep the target as the floor.
  const target = Number(btn.dataset.price);
  setPrice(negotiable ? Number(btn.dataset.margin) : target, Math.round(target * 0.9));
  renderMarket();
});

function renderDesired() {
  const m = draft.market;
  const price = Number($('price').value);
  if (!m?.stats || !price) { $('desired').textContent = ''; return; }
  const sorted = m.comparables.map((c) => c.price).sort((a, b) => a - b);
  const below = sorted.filter((p) => p < price).length;
  const pct = Math.round((below / sorted.length) * 100);
  const verdict = price <= m.stats.p25 ? 'très compétitif' : price <= m.stats.median ? 'compétitif' : price <= m.stats.p75 ? 'au-dessus du marché' : 'cher pour le marché';
  $('desired').innerHTML = `À ${money(price)}, tu es moins cher que ${100 - pct} % des annonces comparables — <b>${verdict}</b>.`;
  $('step-copy').hidden = false;
}

for (const id of ['price', 'floor']) {
  $(id).addEventListener('input', () => {
    draft.price = Number($('price').value);
    draft.floor = Number($('floor').value);
    saveDraft();
    renderDesired();
    renderLadder();
    $('step-copy').hidden = !draft.price;
  });
}

// ============================================================ 4. COPY

$('write').addEventListener('click', (e) => busy(e.currentTarget, async () => {
  if (!draft.price) throw new Error('Choisis un prix d’abord.');
  const copy = await api('/api/copy', {
    method: 'POST',
    body: {
      item: draft.item, price: draft.price, tone: $('tone').value, lang: $('lang').value,
      pickupArea: $('pickup').value, negotiable: $('negotiable').checked, delivery: $('delivery').checked, extraNotes: draft.notes || '',
    },
  });
  Object.assign(draft, { title: copy.title, description: copy.description, alternateTitles: copy.alternateTitles });
  await saveDraft();
  renderCopy();
}));

function renderCopy() {
  $('title').value = draft.title || '';
  $('description').value = draft.description || '';
  $('title-count').textContent = draft.title ? `${draft.title.length} car.` : '';
  $('step-plan').hidden = !draft.title;
}
for (const id of ['title', 'description']) {
  $(id).addEventListener('input', () => { draft[id] = $(id).value; saveDraft(); renderCopy(); });
}

// ============================================================ 5. PLAN

function currentPlan() {
  const mode = document.querySelector('input[name=mode]:checked').value;
  return {
    mode,
    autoApprove: { renew: $('auto-renew').checked, price_drop: $('auto-drop').checked },
    boost: { enabled: $('boost').checked, dailyBudget: Number($('boost-budget').value) || 3, days: Number($('boost-days').value) || 3 },
  };
}

function renderLadder() {
  if (!meta || !draft.price) { $('ladder').innerHTML = ''; return; }
  const plan = meta.planPresets[currentPlan().mode];
  const floor = Math.min(Number($('floor').value) || draft.price, draft.price);
  const steps = [{ day: 0, price: draft.price }];
  let price = draft.price;
  while (price > floor && steps.length < 10) {
    let next = Math.max(floor, nicePrice(price * (1 - plan.dropPct)));
    if (next >= price) next = floor;
    price = next;
    steps.push({ day: (steps.length) * plan.dropEveryDays, price });
  }
  $('ladder').innerHTML = `<span class="muted">Sans vente, avec ton accord :</span>${steps.map((s) => `<span>J+${s.day} : ${money(s.price)}</span>`).join('')}`;
}
document.querySelector('.modes').addEventListener('change', renderLadder);
$('boost').addEventListener('change', () => { $('boost-opts').hidden = !$('boost').checked; });

$('save-fill').addEventListener('click', (e) => busy(e.currentTarget, async () => {
  const floor = Number($('floor').value);
  const listing = await api('/api/listings', {
    method: 'POST',
    body: {
      title: $('title').value, description: $('description').value, price: Number($('price').value),
      floorPrice: Number.isFinite(floor) && floor > 0 ? floor : undefined,
      categoryId: $('category').value, conditionId: $('condition').value,
      pickupArea: $('pickup').value, sessionId: draft.sessionId, item: draft.item,
      alternateTitles: draft.alternateTitles || [], market: draft.market ? { stats: draft.market.stats, scannedAt: new Date().toISOString() } : null,
      plan: currentPlan(),
    },
  });
  flash('Annonce enregistrée. Ouverture de Marketplace…');
  const report = await bg('mp:openCreate', { listingId: listing.id });
  const missing = report?.missing?.length ? ` Champs à compléter à la main : ${report.missing.join(', ')}.` : '';
  flash(`Formulaire rempli ✅${missing}`, missing ? 'error' : 'info', 10000);
  draft = {};
  await saveDraft();
  renderCreate();
}));

// ---------------------------------------------------------- render all

function renderCreate() {
  $('session').hidden = !draft.sessionId;
  $('new-session').textContent = draft.sessionId ? 'Recommencer une nouvelle annonce' : 'Nouvelle annonce';
  if (draft.sessionId) {
    $('qr').innerHTML = draft.qrSvg || '';
    $('mobile-link').href = draft.mobileUrl;
  }
  $('notes').value = draft.notes || '';
  if (draft.price) $('price').value = draft.price; else $('price').value = '';
  if (draft.floor) $('floor').value = draft.floor; else $('floor').value = '';
  renderPhotos();
  renderItem();
  renderMarket();
  renderDesired();
  renderCopy();
  renderLadder();
  if (!draft.item) { for (const id of ['step-market', 'step-copy', 'step-plan']) $(id).hidden = true; }
}

// ======================================================== LISTINGS TAB

const STATUS = { draft: 'Brouillon', active: 'En ligne', pending: 'En attente', sold: 'Vendu', archived: 'Archivé' };

async function loadListings() {
  try {
    const listings = await api('/api/listings');
    $('listings').innerHTML = listings.length ? listings.map(listingCard).join('') : '<p class="empty">Aucune annonce pour l’instant.</p>';
  } catch (err) {
    $('listings').innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

function listingCard(l) {
  const s = l.stats || {};
  const days = l.postedAt ? Math.floor((Date.now() - new Date(l.postedAt)) / 86400000) : null;
  const ladder = l.status === 'active' && l.ladder?.length > 1
    ? `<div class="ladder">${l.ladder.slice(0, 6).map((x) => `<span>${money(x.price)}</span>`).join('→')}</div>` : '';
  return `<article class="card" data-id="${l.id}">
    <span class="pill ${l.status}">${STATUS[l.status] || l.status}</span>
    <h4>${esc(l.title)}</h4>
    <div class="meta">${money(l.price)} · plancher ${money(l.floorPrice)}${days != null ? ` · ${days} j en ligne` : ''}
      ${s.views != null ? ` · ${s.views} clics` : ''} · ${s.messages || 0} message(s)</div>
    ${ladder}
    <div>
      ${l.status === 'draft' ? '<button class="small" data-act="fill">Remplir sur Facebook</button>' : ''}
      ${l.fbUrl ? `<a class="small" href="${esc(l.fbUrl)}" target="_blank" rel="noopener">Voir</a>` : ''}
      ${['active', 'pending'].includes(l.status) ? `
        <button class="small secondary" data-act="messages">+1 message</button>
        <button class="small secondary" data-act="reply">Réponse IA</button>
        <button class="small secondary" data-act="sold">Vendu</button>` : ''}
      ${l.status !== 'archived' ? '<button class="small secondary" data-act="archive">Archiver</button>' : ''}
    </div>
    <div class="reply" hidden>
      <label>Message de l’acheteur<textarea rows="2"></textarea></label>
      <button class="small" data-act="draft-reply">Proposer une réponse</button>
      <p class="reply-out small"></p>
    </div>
  </article>`;
}

$('listings').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const card = btn.closest('.card');
  const id = card.dataset.id;
  const act = btn.dataset.act;
  await busy(btn, async () => {
    if (act === 'fill') {
      await bg('mp:openCreate', { listingId: id });
    } else if (act === 'messages') {
      const l = await api(`/api/listings/${id}`);
      await api(`/api/listings/${id}`, { method: 'PATCH', body: { stats: { messages: (l.stats?.messages || 0) + 1 } } });
    } else if (act === 'sold') {
      const price = prompt('Vendu à quel prix ? ($)');
      if (price === null) return;
      await api(`/api/listings/${id}`, { method: 'PATCH', body: { status: 'sold', ...(Number(price) ? { soldPrice: Number(price) } : {}) } });
      flash('Bravo pour la vente 🎉 N’oublie pas de la marquer vendue sur Facebook aussi.');
    } else if (act === 'archive') {
      await api(`/api/listings/${id}`, { method: 'PATCH', body: { status: 'archived' } });
    } else if (act === 'reply') {
      card.querySelector('.reply').hidden = !card.querySelector('.reply').hidden;
      return;
    } else if (act === 'draft-reply') {
      const buyerMessage = card.querySelector('.reply textarea').value.trim();
      if (!buyerMessage) return;
      const r = await api('/api/reply', { method: 'POST', body: { listingId: id, buyerMessage } });
      await navigator.clipboard.writeText(r.reply).catch(() => {});
      card.querySelector('.reply-out').innerHTML = `${esc(r.reply)}<br><span class="muted">Copié ✔${r.scamSignals.length ? ` · <span class="warn">⚠️ ${r.scamSignals.map(esc).join(', ')}</span>` : ''}</span>`;
      return;
    }
    loadListings();
  });
});

$('sync').addEventListener('click', (e) => busy(e.currentTarget, async () => {
  const res = await bg('mp:syncNow');
  const matched = res.results.filter((r) => r.matched).length;
  flash(`${matched} annonce(s) synchronisée(s) sur ${res.results.length} trouvée(s) sur Facebook.`);
  loadListings();
}));

// ======================================================= DECISIONS TAB

const ACTION_LABELS = { renew: 'Relancer', price_drop: 'Baisse de prix', relist: 'Republier', boost: 'Booster (payant)', advice: 'Conseil' };

function actionCard(a, pending) {
  const l = a.listing || {};
  const priceInput = pending && a.type === 'price_drop'
    ? `<label>Nouveau prix (plancher ${money(l.floorPrice)})<input type="number" min="${esc(l.floorPrice)}" value="${esc(a.payload.to)}" data-price></label>` : '';
  const when = new Date(a.scheduledFor);
  const schedule = !pending && when > new Date() ? `<p class="small muted">Prévu ${when.toLocaleString('fr-CA', { weekday: 'long', hour: '2-digit', minute: '2-digit' })} (heure de pointe)</p>` : '';
  const err = a.lastError ? `<p class="small warn">Dernier essai : ${esc(a.lastError)}</p>` : '';
  return `<article class="card" data-id="${a.id}">
    <span class="pill ${a.type}">${ACTION_LABELS[a.type] || a.type}</span>
    <h4>${esc(l.title || '—')}</h4>
    <p class="small muted">${esc(a.reason)}</p>
    ${priceInput}${schedule}${err}
    ${pending
      ? `<button class="small" data-act="approve">${a.type === 'advice' ? 'Compris' : 'Approuver'}</button>${a.type === 'advice' ? '' : '<button class="small danger" data-act="reject">Refuser</button>'}`
      : '<button class="small" data-act="run">Exécuter maintenant</button><button class="small danger" data-act="reject">Annuler</button>'}
  </article>`;
}

async function loadDecisions() {
  try {
    const actions = await api('/api/actions?status=pending,approved');
    const pending = actions.filter((a) => a.status === 'pending');
    const approved = actions.filter((a) => a.status === 'approved');
    $('pending').innerHTML = pending.length ? pending.map((a) => actionCard(a, true)).join('') : '<p class="empty">Rien à décider 👌</p>';
    $('approved').innerHTML = approved.length ? approved.map((a) => actionCard(a, false)).join('') : '<p class="empty">File vide.</p>';
    $('decision-count').hidden = !pending.length;
    $('decision-count').textContent = pending.length;
  } catch (err) {
    $('pending').innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

document.getElementById('tab-decisions').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const card = btn.closest('.card');
  const id = card.dataset.id;
  await busy(btn, async () => {
    if (btn.dataset.act === 'approve') {
      const input = card.querySelector('[data-price]');
      await api(`/api/actions/${id}/approve`, { method: 'POST', body: input ? { price: Number(input.value) } : {} });
    } else if (btn.dataset.act === 'reject') {
      await api(`/api/actions/${id}/reject`, { method: 'POST', body: {} });
    } else if (btn.dataset.act === 'run') {
      const [result] = await bg('mp:runActions', { actionId: id });
      flash(result?.ok ? (result.note || 'Action exécutée ✅') : (result?.error || 'Rien à exécuter'), result?.ok ? 'info' : 'error');
    }
    await bg('mp:refreshBadge').catch(() => {});
    loadDecisions();
  });
});

$('run-strategy').addEventListener('click', (e) => busy(e.currentTarget, async () => {
  const { created } = await api('/api/strategy/run', { method: 'POST' });
  flash(created.length ? `${created.length} nouvelle(s) proposition(s).` : 'Rien de nouveau : tes annonces suivent le plan.');
  loadDecisions();
}));

$('run-actions').addEventListener('click', (e) => busy(e.currentTarget, async () => {
  const results = await bg('mp:runActions');
  const ok = results.filter((r) => r.ok).length;
  flash(results.length ? `${ok}/${results.length} action(s) exécutée(s).` : 'Aucune action approuvée en file.');
  loadDecisions();
}));

// ======================================================== SETTINGS TAB

async function loadSettings() {
  const s = await getSettings();
  $('s-server').value = s.serverUrl;
  $('s-token').value = s.token;
  $('s-city').value = s.citySlug;
  $('s-pickup').value = s.pickupArea;
  $('s-auto-exec').checked = s.autoExecute;
  $('s-auto-submit').checked = s.autoSubmit;
  if (s.token) renderPhoneLink(s);
}

async function renderPhoneLink(s) {
  try {
    const { svg } = await api('/api/qr', { method: 'POST', body: { text: `${s.serverUrl}/m/approvals#k=${s.token}` } });
    $('approvals-qr').innerHTML = svg;
    $('phone-link').hidden = false;
  } catch { $('phone-link').hidden = true; }
}

$('s-save').addEventListener('click', (e) => busy(e.currentTarget, async () => {
  const s = await saveSettings({
    serverUrl: $('s-server').value.trim(), token: $('s-token').value.trim(), citySlug: $('s-city').value.trim().toLowerCase(),
    pickupArea: $('s-pickup').value.trim(), autoExecute: $('s-auto-exec').checked, autoSubmit: $('s-auto-submit').checked,
  });
  const health = await fetch(`${s.serverUrl}/api/health`).then((r) => r.json()).catch(() => null);
  if (!health) throw new Error('Serveur injoignable à cette adresse.');
  meta = await api('/api/meta');
  $('s-status').innerHTML = `✅ Connecté · IA ${health.ai ? 'active' : '<span class="warn">inactive (clé API manquante)</span>'} · notifications ${health.notifications ? 'actives' : 'désactivées'}`;
  renderPhoneLink(s);
}));

// ----------------------------------------------------------------- boot

(async () => {
  const s = await getSettings();
  draft = (await chrome.storage.local.get('draft')).draft || {};
  $('pickup').value = draft.pickupArea || s.pickupArea || '';
  $('tone').value = s.tone;
  $('lang').value = s.lang;
  if (!s.token) { showTab('settings'); flash('Bienvenue ! Configure ton serveur MarketPilot pour commencer.', 'info', 0); return; }
  try {
    meta = await api('/api/meta');
  } catch (err) {
    flash(err.message, 'error', 0);
    showTab('settings');
    return;
  }
  renderCreate();
  const pending = await api('/api/actions?status=pending').catch(() => []);
  $('decision-count').hidden = !pending.length;
  $('decision-count').textContent = pending.length;
})();
