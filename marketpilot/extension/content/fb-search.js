// Reads the Marketplace search results the user's own browser displays,
// to compare prices. Only runs when the side panel asks for a market scan.

(() => {
  const { itemIdFrom, PRICE_RE, sleep, waitFor, norm } = window.MP;

  function parseCard(anchor) {
    const id = itemIdFrom(anchor.href);
    if (!id) return null;
    const lines = anchor.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
    const priceIdx = lines.findIndex((l) => PRICE_RE.test(l));
    if (priceIdx === -1) return null;
    // Reduced prices show "new price / old price" on consecutive lines.
    let i = priceIdx + 1;
    while (i < lines.length && PRICE_RE.test(lines[i])) i++;
    const title = lines[i];
    if (!title) return null;
    return {
      id,
      url: `https://www.facebook.com/marketplace/item/${id}/`,
      price: lines[priceIdx],
      previousPrice: i - priceIdx > 1 ? lines[priceIdx + 1] : null,
      title,
      location: lines[i + 1] || '',
      image: anchor.querySelector('img')?.src || '',
    };
  }

  function collect() {
    const seen = new Map();
    for (const a of document.querySelectorAll('a[href*="/marketplace/item/"]')) {
      const card = parseCard(a);
      if (card && !seen.has(card.id)) seen.set(card.id, card);
    }
    return [...seen.values()];
  }

  async function scrape({ scrolls = 3, max = 80 } = {}) {
    await waitFor(() => document.querySelector('a[href*="/marketplace/item/"]'), { timeout: 12000 });
    // Facebook shows "no results" / "results outside your area" separators; stop at them.
    for (let i = 0; i < scrolls && collect().length < max; i++) {
      window.scrollBy(0, window.innerHeight * 1.5);
      await sleep(1200 + Math.random() * 800);
    }
    let items = collect();
    const outside = [...document.querySelectorAll('span, h2')].find((el) => /resultats? en dehors|results outside|plus loin/.test(norm(el.textContent)));
    if (outside) {
      items = items.filter((item) => {
        const a = document.querySelector(`a[href*="/marketplace/item/${item.id}"]`);
        return a && (outside.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_PRECEDING);
      });
    }
    return items.slice(0, max);
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== 'mp:scrapeSearch') return;
    scrape(msg.options).then((items) => sendResponse({ ok: true, items }), (err) => sendResponse({ ok: false, error: err.message }));
    return true;
  });
})();
