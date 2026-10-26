// Marketplace inbox + Messenger threads:
//  • counts buyer conversations per listing (feeds the pricing strategy:
//    no price drop while buyers are talking to you);
//  • adds a "✨ Réponse IA" button in Marketplace conversations that drafts
//    a reply from the whole thread and puts it in the composer — never sends.

(() => {
  const MP = window.MP;
  if (!MP || window.__mpInbox) return;
  window.__mpInbox = true;

  const isInbox = () => /\/marketplace\/inbox/.test(location.pathname);
  // Only conversations — not item pages, which also have a "message the seller" box.
  const isThread = () => /\/(messages|marketplace)\/t\//.test(location.pathname) || isInbox();
  const UNREAD = ['non lu', 'unread', 'nouveau message', 'new message'];

  // ------------------------------------------------------------- inbox

  /** Conversation rows look like "Julie · Vélo Trek FX 3" + last message. */
  function scrapeInbox() {
    const rows = [...document.querySelectorAll('[role=row], [role=listitem], a[href*="/t/"]')]
      .filter((el) => MP.isVisible(el) && !el.closest('[role=row] [role=row]'));
    const seen = new Set();
    const threads = [];
    for (const row of rows) {
      const lines = (row.innerText || '').split('\n').map((l) => l.trim()).filter(Boolean);
      const header = lines.find((l) => / [·•] /.test(l));
      if (!header) continue;
      const [buyer, ...rest] = header.split(/ [·•] /);
      const listingTitle = rest.join(' · ').trim();
      if (!listingTitle || seen.has(`${buyer}|${listingTitle}`)) continue;
      seen.add(`${buyer}|${listingTitle}`);
      const label = MP.norm(row.getAttribute('aria-label') || '');
      const snippetEl = [...row.querySelectorAll('span')].find((s) => s.textContent.trim() === lines[lines.indexOf(header) + 1]);
      const bold = snippetEl ? Number(getComputedStyle(snippetEl).fontWeight) >= 600 : false;
      threads.push({
        buyer: buyer.trim(),
        listingTitle,
        snippet: (lines[lines.indexOf(header) + 1] || '').slice(0, 300),
        unread: bold || UNREAD.some((u) => label.includes(u)),
      });
    }
    return threads;
  }

  async function syncInbox() {
    const found = await MP.waitFor(() => scrapeInbox().length, { timeout: 15000 });
    if (!found) return { ok: false, error: 'Aucune conversation Marketplace trouvée sur cette page.' };
    const threads = scrapeInbox();
    const res = await chrome.runtime.sendMessage({ type: 'mp:inboxSync', threads });
    return { ok: true, threads: threads.length, result: res?.result };
  }

  // ------------------------------------------------------- thread reply

  function threadContext() {
    const main = document.querySelector('[role=main]') || document.body;
    const itemLink = main.querySelector('a[href*="/marketplace/item/"]');
    const fbId = itemLink ? MP.itemIdFrom(itemLink.href) : null;
    // Thread header usually shows "Buyer · Listing title".
    const headerLine = [...main.querySelectorAll('h1, h2, [role=heading], a[href*="/marketplace/item/"] span')]
      .map((el) => el.textContent.trim())
      .find((t) => / [·•] /.test(t) || t.length > 3);
    const listingTitle = headerLine?.includes('·') ? headerLine.split(/ [·•] /).slice(1).join(' · ') : headerLine || '';

    // Messages: bubbles on the right are ours. Compare each row's centre to the thread's centre.
    const box = main.getBoundingClientRect();
    const centre = box.left + box.width / 2;
    const rows = [...main.querySelectorAll('[role=row]')].filter(MP.isVisible);
    const history = [];
    for (const row of rows) {
      const bubble = row.querySelector('[dir=auto]');
      const text = bubble?.innerText?.trim();
      if (!text || text.length > 2000) continue;
      const r = bubble.getBoundingClientRect();
      const from = r.left + r.width / 2 > centre ? 'me' : 'buyer';
      if (history.at(-1)?.text === text) continue;
      history.push({ from, text });
    }
    return { fbId, listingTitle, history: history.slice(-20) };
  }

  function composer() {
    const boxes = [...document.querySelectorAll('[role=textbox][contenteditable=true]')].filter(MP.isVisible);
    return boxes.at(-1) || null;
  }

  function insertReply(text) {
    const box = composer();
    if (!box) return false;
    box.focus();
    document.execCommand('selectAll', false);
    document.execCommand('insertText', false, text);
    return true;
  }

  let panel = null;
  function showPanel(html) {
    panel?.remove();
    panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'fixed', right: '24px', bottom: '96px', zIndex: 2147483647, width: '340px', maxWidth: 'calc(100vw - 48px)',
      background: '#fff', color: '#1c1e21', borderRadius: '14px', padding: '14px', boxShadow: '0 10px 40px rgba(0,0,0,.25)',
      font: '14px/1.45 system-ui, sans-serif', border: '1px solid #dadde1',
    });
    panel.innerHTML = html;
    document.body.append(panel);
    panel.addEventListener('click', (e) => { if (e.target.dataset.close != null) panel.remove(); });
    return panel;
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const INTENTS = { availability: 'Disponibilité', negotiation: 'Négociation', lowball: 'Offre trop basse', logistics: 'Logistique', question: 'Question', scam_risk: 'Risque d’arnaque', other: 'Autre' };

  async function suggest(button) {
    const ctx = threadContext();
    if (!ctx.history.some((m) => m.from === 'buyer')) {
      showPanel('<b>MarketPilot</b><p>Aucun message d’acheteur détecté dans cette conversation.</p><button data-close style="all:unset;color:#1b74e4;cursor:pointer;font-weight:600">Fermer</button>');
      return;
    }
    button.textContent = '✨ …';
    try {
      const res = await chrome.runtime.sendMessage({ type: 'mp:replyThread', ...ctx });
      if (!res?.ok) throw new Error(res?.error || 'Erreur');
      const r = res.result;
      const inserted = insertReply(r.reply);
      const scam = r.scamSignals?.length
        ? `<p style="color:#cf222e;font-weight:600;margin:8px 0 0">⚠️ ${r.scamSignals.map(esc).join(' · ')}</p>` : '';
      showPanel(`
        <div style="display:flex;justify-content:space-between;align-items:center"><b>✨ Réponse proposée</b>
          <span style="font-size:12px;color:#65676b">${esc(INTENTS[r.intent] || r.intent)}${r.listingId ? '' : ' · annonce non reconnue'}</span></div>
        <p style="margin:8px 0;padding:10px;background:#f0f2f5;border-radius:10px">${esc(r.reply)}</p>
        ${scam}
        <p style="font-size:12px;color:#65676b;margin:8px 0 0">${inserted ? 'Insérée dans la zone de message — relis puis appuie sur Entrée.' : 'Zone de message introuvable : copie le texte.'}</p>
        <div style="display:flex;gap:12px;margin-top:8px">
          <button data-copy style="all:unset;color:#1b74e4;cursor:pointer;font-weight:600">Copier</button>
          <button data-close style="all:unset;color:#65676b;cursor:pointer">Fermer</button>
        </div>`);
      panel.querySelector('[data-copy]').addEventListener('click', () => navigator.clipboard.writeText(r.reply));
    } catch (err) {
      showPanel(`<b>MarketPilot</b><p>${esc(err.message)}</p><button data-close style="all:unset;color:#1b74e4;cursor:pointer;font-weight:600">Fermer</button>`);
    } finally {
      button.textContent = '✨ Réponse IA';
    }
  }

  function ensureButton() {
    const existing = document.getElementById('mp-reply-btn');
    const show = isThread() && composer();
    if (!show) { existing?.remove(); return; }
    if (existing) return;
    const btn = document.createElement('button');
    btn.id = 'mp-reply-btn';
    btn.textContent = '✨ Réponse IA';
    Object.assign(btn.style, {
      position: 'fixed', right: '24px', bottom: '40px', zIndex: 2147483646, padding: '10px 16px', border: '0', borderRadius: '99px',
      background: 'linear-gradient(135deg,#1b74e4,#7b2ff7)', color: '#fff', font: '600 14px system-ui, sans-serif',
      boxShadow: '0 6px 20px rgba(27,116,228,.4)', cursor: 'pointer',
    });
    btn.addEventListener('click', () => suggest(btn));
    document.body.append(btn);
  }

  // Facebook is a single-page app: re-check as the user navigates.
  setInterval(ensureButton, 1500);

  let inboxSynced = '';
  setInterval(() => {
    if (isInbox() && inboxSynced !== location.href) {
      inboxSynced = location.href;
      syncInbox().catch(() => {});
    }
  }, 3000);

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'mp:scrapeInbox') {
      syncInbox().then(sendResponse, (err) => sendResponse({ ok: false, error: err.message }));
      return true;
    }
  });
})();
