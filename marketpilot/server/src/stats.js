// Seller dashboard numbers.

const DAY = 86400000;
// Rough manual effort MarketPilot replaces: writing + pricing research +
// form filling per listing, and each renew/price edit done by hand.
const MINUTES_PER_LISTING = 15;
const MINUTES_PER_ACTION = 2;

export function computeStats(listings, actions, now = new Date()) {
  const sold = listings.filter((l) => l.status === 'sold');
  const active = listings.filter((l) => ['active', 'pending'].includes(l.status));
  const drafts = listings.filter((l) => l.status === 'draft');
  const published = listings.filter((l) => l.postedAt);

  const revenue = sold.reduce((sum, l) => sum + (Number(l.soldPrice ?? l.price) || 0), 0);
  const durations = sold
    .filter((l) => l.postedAt && l.soldAt)
    .map((l) => (new Date(l.soldAt) - new Date(l.postedAt)) / DAY)
    .filter((d) => d >= 0);
  const doneActions = actions.filter((a) => a.status === 'done' && a.type !== 'advice');
  const monthAgo = now.getTime() - 30 * DAY;

  const round = (v, d = 0) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);
  return {
    revenue: round(revenue, 2),
    revenue30d: round(sold.filter((l) => new Date(l.soldAt || 0).getTime() >= monthAgo).reduce((s, l) => s + (Number(l.soldPrice ?? l.price) || 0), 0), 2),
    soldCount: sold.length,
    activeCount: active.length,
    activeValue: round(active.reduce((s, l) => s + (Number(l.price) || 0), 0), 2),
    draftCount: drafts.length,
    readyCount: drafts.filter((l) => l.pipeline?.stage === 'ready').length,
    avgDaysToSell: durations.length ? round(durations.reduce((a, b) => a + b, 0) / durations.length, 1) : null,
    sellThrough: published.length ? round(sold.length / published.length, 2) : null,
    // Share of the asking price actually obtained, on sales with a recorded price.
    priceRealization: (() => {
      const withBoth = sold.filter((l) => l.soldPrice != null && l.startPrice > 0);
      return withBoth.length ? round(withBoth.reduce((s, l) => s + l.soldPrice / l.startPrice, 0) / withBoth.length, 2) : null;
    })(),
    automatedActions: doneActions.length,
    minutesSaved: published.length * MINUTES_PER_LISTING + doneActions.length * MINUTES_PER_ACTION,
  };
}
