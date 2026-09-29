// "Vos annonces" / "Your listings" page: syncs listing ids, clicks and
// status back to MarketPilot, and performs approved renew / boost actions.

(() => {
  const MP = window.MP;
  const isSellingPage = () => /\/marketplace\/you\/selling/.test(location.pathname);
  const MARK_SOLD = ['marquer comme vendu', 'mark as sold', 'marquer comme disponible', 'mark as available'];

  function cardContainers() {
    const buttons = [...document.querySelectorAll('[role=button], a')].filter((el) => {
      const t = MP.norm(el.getAttribute('aria-label') || el.textContent);
      return MARK_SOLD.some((n) => t.startsWith(n)) || /\/marketplace\/item\/\d+/.test(el.getAttribute('href') || '');
    });
    const containers = new Set();
    for (const btn of buttons) {
      let el = btn;
      for (let i = 0; i < 10 && el; i++, el = el.parentElement) {
        const lines = el.innerText?.split('\n').map((l) => l.trim()).filter(Boolean) || [];
        if (lines.some((l) => MP.PRICE_RE.test(l)) && lines.length >= 3) { containers.add(el); break; }
      }
    }
    // Keep the innermost containers only.
    return [...containers].filter((c) => ![...containers].some((o) => o !== c && c.contains(o)));
  }

  function parseContainer(el) {
    const lines = el.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
    const priceIdx = lines.findIndex((l) => MP.PRICE_RE.test(l));
    const title = lines.find((l, i) => i !== priceIdx && !MP.PRICE_RE.test(l) && l.length > 2 && !/^(\d+|·)$/.test(l));
    const anchor = el.querySelector('a[href*="/marketplace/item/"]');
    const text = MP.norm(el.innerText);
    const views = text.match(/(\d[\d\s]*)\s+(clics?|clicks?|vues?|views?)/);
    const status = MP.LABELS.sold.some((s) => new RegExp(`(^|\\s)${s}(\\s|$)`).test(text) && !text.includes('marquer comme vendu') && !text.includes('mark as sold'))
      ? 'sold'
      : MP.LABELS.pending.some((s) => text.includes(s)) ? 'pending' : 'active';
    const priceText = lines[priceIdx] || '';
    const price = Number.parseFloat(priceText.replace(/[^\d.,]/g, '').replace(/\s/g, '').replace(',', '.'));
    return {
      fbId: anchor ? MP.itemIdFrom(anchor.href) : undefined,
      url: anchor?.href,
      title: title || '',
      price: Number.isFinite(price) ? price : null,
      status,
      views: views ? Number(views[1].replace(/\s/g, '')) : null,
      el,
    };
  }

  function scrape() {
    return cardContainers().map(parseContainer).filter((c) => c.title);
  }

  function findCard({ fbId, title }) {
    const cards = scrape();
    return cards.find((c) => fbId && c.fbId === fbId)
      || cards.find((c) => title && MP.norm(c.title) === MP.norm(title))
      || cards.find((c) => title && MP.norm(c.title).includes(MP.norm(title).slice(0, 25)));
  }

  async function perform({ action, fbId, title }) {
    await MP.waitFor(() => cardContainers().length, { timeout: 15000 });
    const card = findCard({ fbId, title });
    if (!card) return { ok: false, error: 'Annonce introuvable sur la page « Vos annonces ».' };
    const names = action === 'renew' ? MP.LABELS.renew : MP.LABELS.boost;
    let button = MP.findButton(names, card.el);
    if (!button) {
      // Renew/boost can hide behind the "…" menu.
      const more = [...card.el.querySelectorAll('[role=button][aria-haspopup], [aria-label*="plus" i], [aria-label*="more" i]')].find(MP.isVisible);
      if (more) {
        MP.click(more);
        button = await MP.waitFor(() => MP.findButton(names, document.querySelector('[role=menu]') || document), { timeout: 4000 });
      }
    }
    if (!button) {
      return { ok: false, error: action === 'renew' ? 'Bouton « Renouveler » absent (Facebook ne le propose qu’après ~7 jours).' : 'Bouton « Booster » introuvable.' };
    }
    MP.click(button);
    await MP.sleep(1500);
    if (action === 'renew') {
      // Confirmation dialog, when shown.
      const confirm = MP.findButton(MP.LABELS.renew, document.querySelector('[role=dialog]') || document.body);
      if (confirm && confirm !== button) MP.click(confirm);
      MP.toast('MarketPilot : annonce renouvelée ✅');
    } else {
      MP.toast('MarketPilot : choisis le budget du boost puis confirme le paiement.', 10000);
    }
    return { ok: true };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'mp:scrapeSelling') {
      MP.waitFor(() => cardContainers().length, { timeout: 15000 })
        .then(() => sendResponse({ ok: true, items: scrape().map(({ el, ...rest }) => rest) }));
      return true;
    }
    if (msg?.type === 'mp:sellingAction') {
      perform(msg).then(sendResponse, (err) => sendResponse({ ok: false, error: err.message }));
      return true;
    }
  });

  // Passive sync whenever the user opens "Vos annonces".
  if (isSellingPage()) {
    MP.waitFor(() => cardContainers().length, { timeout: 20000 }).then((found) => {
      if (!found) return;
      const items = scrape().map(({ el, ...rest }) => rest);
      chrome.runtime.sendMessage({ type: 'mp:syncSelling', items });
    });
  }
})();
