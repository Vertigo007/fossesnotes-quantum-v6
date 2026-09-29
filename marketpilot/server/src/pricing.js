// Market price analysis over comparable Marketplace listings.

import { bestSimilarity } from './similarity.js';

export function parsePrice(raw) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const text = String(raw || '').toLowerCase();
  if (/gratuit|free/.test(text)) return 0;
  // "1 250 $", "$1,250", "1250,00 $", "CA$45"
  const match = text.replace(/ | /g, ' ').match(/\d[\d\s.,]*/);
  if (!match) return null;
  let num = match[0].trim().replace(/\s/g, '');
  if (/,\d{2}$/.test(num)) num = num.replace(/\./g, '').replace(',', '.');
  else num = num.replace(/,/g, '');
  const value = Number.parseFloat(num);
  return Number.isFinite(value) ? value : null;
}

export function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Rounds to a "Marketplace-looking" price: 23 -> 25, 187 -> 185, 1234 -> 1225. */
export function nicePrice(value) {
  if (value == null || !Number.isFinite(value) || value <= 0) return 0;
  const step = value < 20 ? 1 : value < 100 ? 5 : value < 1000 ? 5 : value < 5000 ? 25 : 50;
  return Math.max(step, Math.round(value / step) * step);
}

function removeOutliers(sorted) {
  if (sorted.length < 5) return sorted;
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return sorted.filter((p) => p >= lo && p <= hi);
}

/** Share of comparables priced strictly below `price`, in [0, 1]. */
export function percentileOf(sorted, price) {
  if (!sorted.length) return null;
  const below = sorted.filter((p) => p < price).length;
  const equal = sorted.filter((p) => p === price).length;
  return (below + equal / 2) / sorted.length;
}

/**
 * Heuristic days-to-sell estimate. Priced at the median, a typical item
 * sells in ~7 days; every 10 percentiles above/below scales it ~1.35x.
 * Returned as a range because it is an estimate, not a promise.
 */
export function estimateDaysToSell(percentile) {
  if (percentile == null) return null;
  const base = 7 * Math.exp(3 * (percentile - 0.5));
  const days = Math.max(1, base);
  return { min: Math.max(1, Math.round(days * 0.6)), max: Math.max(2, Math.round(days * 1.5)) };
}

/**
 * @param {Array<{title:string, price:any, url?:string, location?:string, match?:string}>} listings
 * @param {{queries:string[], minSimilarity?:number, desiredPrice?:number|null, condition?:string}} opts
 */
export function analyzeMarket(listings, opts) {
  const { queries = [], minSimilarity = 0.35, desiredPrice = null } = opts || {};
  const seen = new Set();
  const comparables = [];
  for (const item of listings || []) {
    const price = parsePrice(item.price);
    if (price == null || price <= 0) continue; // "free" and "contact us" skew stats
    const key = item.url || `${item.title}|${price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    let similarity = queries.length ? bestSimilarity(item.title, queries) : 1;
    // AI judgement (identical/similar/different) overrides the lexical score.
    if (item.match === 'identical') similarity = Math.max(similarity, 0.95);
    else if (item.match === 'similar') similarity = Math.max(similarity, 0.6);
    else if (item.match === 'different') similarity = 0;
    comparables.push({ ...item, price, similarity });
  }
  const relevant = comparables.filter((c) => c.similarity >= minSimilarity);
  const sorted = removeOutliers(relevant.map((c) => c.price).sort((a, b) => a - b));

  const result = {
    totalScanned: (listings || []).length,
    comparableCount: relevant.length,
    usedCount: sorted.length,
    identicalCount: relevant.filter((c) => c.similarity >= 0.8).length,
    confidence: sorted.length >= 12 ? 'haute' : sorted.length >= 5 ? 'moyenne' : sorted.length > 0 ? 'faible' : 'aucune',
    stats: null,
    strategies: [],
    desired: null,
    comparables: relevant.sort((a, b) => b.similarity - a.similarity || a.price - b.price).slice(0, 40),
  };
  if (!sorted.length) return result;

  const stats = {
    min: sorted[0],
    p25: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    p75: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1],
    mean: sorted.reduce((s, p) => s + p, 0) / sorted.length,
  };
  result.stats = Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, Math.round(v * 100) / 100]));

  const strategy = (id, label, price, description) => {
    const pct = percentileOf(sorted, price);
    return { id, label, price, percentile: pct, daysToSell: estimateDaysToSell(pct), description };
  };
  // "Fast" undercuts the cheapest quarter so the ad is among the first
  // cheap results for buyers sorting by price.
  const fast = nicePrice(Math.min(stats.p25 * 0.95, stats.median * 0.85));
  result.strategies = [
    strategy('fast', 'Vendre vite', fast, 'Sous 75 % des annonces comparables — messages rapides, vente en quelques jours.'),
    strategy('market', 'Prix du marché', nicePrice(stats.median), 'Au prix médian — bon équilibre entre délai et montant.'),
    strategy('max', 'Maximiser', nicePrice(stats.p75), 'Dans le quart supérieur — plus long, prévoir de la négociation.'),
  ];
  // Buyers negotiate on Marketplace: suggest listing ~10 % above the target
  // when the seller is willing to negotiate.
  for (const s of result.strategies) s.listWithMargin = nicePrice(s.price * 1.1);

  if (desiredPrice != null && Number.isFinite(Number(desiredPrice))) {
    const price = Number(desiredPrice);
    const pct = percentileOf(sorted, price);
    let verdict;
    if (price <= stats.p25) verdict = 'Très compétitif : ton annonce sera parmi les moins chères.';
    else if (price <= stats.median) verdict = 'Compétitif : sous le prix médian du marché.';
    else if (price <= stats.p75) verdict = 'Au-dessus de la médiane : vente plus lente, attends-toi à négocier.';
    else verdict = 'Cher pour le marché : risque de peu de messages. Prévois une baisse planifiée.';
    result.desired = { price, percentile: pct, daysToSell: estimateDaysToSell(pct), verdict };
  }
  return result;
}
