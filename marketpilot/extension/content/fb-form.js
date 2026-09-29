// Fills the Marketplace "create listing" and "edit listing" forms.
// By default it stops before publishing: you review, then click Publish.

(() => {
  const MP = window.MP;
  const { LABELS } = MP;

  async function dataUrlToFile(dataUrl, name) {
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], name, { type: blob.type || 'image/jpeg' });
  }

  async function addPhotos(photos) {
    const input = await MP.waitFor(() => document.querySelector('input[type=file][accept*="image"]'), { timeout: 10000 });
    if (!input) return false;
    const dt = new DataTransfer();
    for (const [i, p] of photos.entries()) dt.items.add(await dataUrlToFile(p.dataUrl, p.name || `photo-${i + 1}.jpg`));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  async function fillText(names, value, report, key, { optional = false } = {}) {
    if (value == null || value === '') return;
    const field = await MP.waitFor(() => MP.findField(names), { timeout: optional ? 2000 : 6000 });
    if (!field) { if (!optional) report.missing.push(key); return; }
    MP.setValue(field, String(value));
    report.filled.push(key);
    await MP.humanPause();
  }

  async function fillChoice(names, option, report, key) {
    if (!option) return;
    const field = await MP.waitFor(() => MP.findField(names, { kinds: '[role=combobox], [aria-haspopup], label[role=button], [role=button]' }), { timeout: 6000 });
    if (!field) { report.missing.push(key); return; }
    const ok = await MP.choose(field, [option.fr, option.en].filter(Boolean));
    (ok ? report.filled : report.missing).push(key);
  }

  function watchSubmit(actionId, listingId) {
    const names = [...LABELS.publish, ...LABELS.update];
    const onClick = (e) => {
      const btn = e.target.closest('[role=button], button');
      if (!btn) return;
      const text = MP.norm(btn.getAttribute('aria-label') || btn.textContent);
      if (!names.some((n) => text.startsWith(n))) return;
      document.removeEventListener('click', onClick, true);
      chrome.runtime.sendMessage({ type: 'mp:submitted', actionId, listingId });
    };
    document.addEventListener('click', onClick, true);
  }

  async function fill(data) {
    const report = { filled: [], missing: [], submitted: false };
    await MP.waitFor(() => MP.findField(LABELS.price) || MP.findField(LABELS.title), { timeout: 20000 });

    if (data.photos?.length) {
      (await addPhotos(data.photos)) ? report.filled.push('photos') : report.missing.push('photos');
      await MP.sleep(1500); // let uploads start before touching other fields
    }
    await fillText(LABELS.title, data.title, report, 'title');
    await fillText(LABELS.price, data.price, report, 'price');
    await fillChoice(LABELS.category, data.category, report, 'category');
    await fillChoice(LABELS.condition, data.condition, report, 'condition');
    // Some categories reveal extra fields (brand) only after selection.
    if (data.brand) await fillText(LABELS.brand, data.brand, report, 'brand', { optional: true });
    await fillText(LABELS.description, data.description, report, 'description');

    const submitNames = data.mode === 'edit' ? LABELS.update : [...LABELS.next, ...LABELS.publish];
    const submit = MP.findButton(submitNames);
    if (data.autoSubmit && submit && !report.missing.length) {
      await MP.sleep(1500);
      MP.click(submit);
      // "Next" leads to the delivery/groups step; publish from there.
      if (data.mode !== 'edit' && LABELS.next.includes(MP.norm(submit.textContent))) {
        const publish = await MP.waitFor(() => MP.findButton(LABELS.publish), { timeout: 10000 });
        if (publish) MP.click(publish);
      }
      report.submitted = true;
    } else {
      watchSubmit(data.actionId, data.listingId);
      const missing = report.missing.length ? ` À compléter : ${report.missing.join(', ')}.` : '';
      MP.highlight(submit, `MarketPilot a rempli l’annonce.${missing} Vérifie puis clique sur « ${data.mode === 'edit' ? 'Mettre à jour' : 'Publier'} ».`);
    }
    return report;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== 'mp:fill') return;
    fill(msg.data).then((report) => sendResponse({ ok: true, report }), (err) => sendResponse({ ok: false, error: err.message }));
    return true;
  });
})();
