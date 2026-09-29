// Shared DOM helpers for Facebook Marketplace pages.
//
// Facebook's class names are obfuscated and change constantly, so we locate
// things the way a screen reader does: by accessible labels and visible text,
// in French and English. If Facebook renames a label, add it to LABELS.

(() => {
  if (window.MP) return;

  const LABELS = {
    title: ['titre', 'title'],
    price: ['prix', 'price'],
    description: ['description'],
    category: ['categorie', 'category'],
    condition: ['etat', 'condition'],
    brand: ['marque', 'brand'],
    photosInput: ['ajouter des photos', 'add photos'],
    next: ['suivant', 'next'],
    publish: ['publier', 'publish'],
    update: ['mettre a jour', 'update', 'enregistrer', 'save'],
    renew: ['renouveler', 'renew'],
    boost: ['booster', 'boost', 'promouvoir', 'promote'],
    sold: ['vendu', 'sold'],
    pending: ['en attente', 'pending'],
  };

  const norm = (s) => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const humanPause = () => sleep(250 + Math.random() * 450);

  const isVisible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };

  async function waitFor(fn, { timeout = 15000, interval = 250 } = {}) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await sleep(interval);
    }
    return null;
  }

  /** Accessible name of a form control. */
  function labelOf(el) {
    const parts = [el.getAttribute('aria-label'), el.getAttribute('placeholder')];
    const labelledby = el.getAttribute('aria-labelledby');
    if (labelledby) {
      for (const id of labelledby.split(/\s+/)) parts.push(document.getElementById(id)?.textContent);
    }
    const label = el.closest('label');
    if (label) parts.push(label.getAttribute('aria-label'), label.textContent);
    if (el.id) parts.push(document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent);
    return norm(parts.filter(Boolean).join(' | '));
  }

  const matchesAny = (text, names) => names.some((n) => text === n || text.startsWith(n) || text.includes(`| ${n}`) || text.split(' | ').some((p) => p.startsWith(n)));

  /** Finds the input/textarea/combobox whose label matches one of `names`. */
  function findField(names, { root = document, kinds = 'input:not([type=file]):not([type=hidden]), textarea, [role=combobox], [contenteditable=true]' } = {}) {
    const candidates = [...root.querySelectorAll(kinds)].filter(isVisible);
    // Exact-ish label match first, then "contains" as a fallback.
    return candidates.find((el) => matchesAny(labelOf(el), names))
      || candidates.find((el) => names.some((n) => labelOf(el).includes(n)))
      || null;
  }

  function findButton(names, root = document) {
    const els = [...root.querySelectorAll('[role=button], button, [role=link], a')].filter(isVisible);
    return els.find((el) => {
      const text = norm(el.getAttribute('aria-label') || el.textContent);
      return names.some((n) => text === n || text.startsWith(n));
    }) || null;
  }

  /** Sets a value on a React-controlled field so React notices the change. */
  function setValue(el, value) {
    el.focus();
    if (el.isContentEditable) {
      document.execCommand('selectAll', false);
      document.execCommand('insertText', false, value);
      return;
    }
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
  }

  function click(el) {
    el.scrollIntoView({ block: 'center' });
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }
  }

  /** Opens a dropdown and picks the option matching one of `optionNames`. */
  async function choose(field, optionNames) {
    click(field);
    const wanted = optionNames.map(norm);
    const option = await waitFor(() => {
      const opts = [...document.querySelectorAll('[role=option], [role=menuitemradio], [role=radio], [role=listbox] [role=button], [role=dialog] [role=button]')].filter(isVisible);
      return opts.find((o) => wanted.includes(norm(o.textContent)))
        || opts.find((o) => wanted.some((w) => norm(o.textContent).startsWith(w)));
    }, { timeout: 5000 });
    if (!option) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return false;
    }
    click(option);
    await humanPause();
    return true;
  }

  function highlight(el, text) {
    if (!el) return;
    el.style.outline = '3px solid #f5a623';
    el.style.outlineOffset = '3px';
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (text) toast(text);
  }

  function toast(text, ms = 6000) {
    const div = document.createElement('div');
    div.textContent = text;
    Object.assign(div.style, {
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 2147483647, maxWidth: '360px',
      background: '#1b74e4', color: '#fff', padding: '12px 16px', borderRadius: '10px',
      font: '600 14px/1.4 system-ui, sans-serif', boxShadow: '0 6px 24px rgba(0,0,0,.25)',
    });
    document.body.append(div);
    setTimeout(() => div.remove(), ms);
  }

  const itemIdFrom = (href) => (String(href || '').match(/\/marketplace\/item\/(\d+)/) || [])[1] || null;
  const PRICE_RE = /^(ca\s?\$|\$)?\s?\d[\d\s.,  ]*\s?\$?$|^(gratuit|free)$/i;

  window.MP = { LABELS, norm, sleep, humanPause, waitFor, isVisible, labelOf, findField, findButton, setValue, click, choose, highlight, toast, itemIdFrom, PRICE_RE };
})();
