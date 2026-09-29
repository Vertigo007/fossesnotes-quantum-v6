// Selling strategy engine: decides when to renew ("relancer"), drop the
// price (never below the floor, only with the owner's approval unless
// auto-approved), relist, or boost a listing.
//
// Pure functions only — the scheduler (scheduler.js) persists proposals and
// the Chrome extension executes approved ones on facebook.com.

import { nicePrice } from './pricing.js';

const DAY = 24 * 60 * 60 * 1000;

export const PLAN_PRESETS = {
  // Aggressive: small steps, often. For items you want gone.
  fast: { dropPct: 0.1, dropEveryDays: 3, renewEveryDays: 7, relistAfterDays: 14 },
  balanced: { dropPct: 0.07, dropEveryDays: 5, renewEveryDays: 7, relistAfterDays: 21 },
  // Patient: protect the price, rely on renewals for visibility.
  max: { dropPct: 0.05, dropEveryDays: 7, renewEveryDays: 7, relistAfterDays: 30 },
};

export const DEFAULT_THRESHOLDS = {
  hotMessages: 3, // at or above this many conversations, don't cut the price
  lowViews: 40, // below this many views after a few days, visibility is the problem
};

export function buildPlan(mode = 'balanced', overrides = {}) {
  const preset = PLAN_PRESETS[mode] || PLAN_PRESETS.balanced;
  return {
    mode: PLAN_PRESETS[mode] ? mode : 'balanced',
    ...preset,
    boost: { enabled: false, minPrice: 100, dailyBudget: 3, days: 3, ...(overrides.boost || {}) },
    autoApprove: { renew: true, price_drop: false, relist: false, boost: false, ...(overrides.autoApprove || {}) },
    ...Object.fromEntries(Object.entries(overrides).filter(([k]) => !['boost', 'autoApprove'].includes(k))),
  };
}

const ts = (v) => (v ? new Date(v).getTime() : 0);
const daysBetween = (from, to) => (to - from) / DAY;

/**
 * Buyer traffic on Marketplace peaks weekday evenings and weekend mornings
 * and evenings. Returns `now` if inside a window, else the next window start
 * (server local time — set TZ, see config.js).
 */
export function nextPrimeTime(now = new Date()) {
  const inWindow = (d) => {
    const day = d.getDay();
    const h = d.getHours();
    const weekend = day === 0 || day === 6;
    return (h >= 18 && h < 21) || (weekend && h >= 9 && h < 12);
  };
  if (inWindow(now)) return new Date(now);
  const probe = new Date(now);
  probe.setMinutes(0, 0, 0);
  for (let i = 0; i < 24 * 8; i++) {
    probe.setHours(probe.getHours() + 1);
    if (inWindow(probe)) return new Date(probe);
  }
  return new Date(now);
}

/** Preview of the price-drop schedule the plan would follow with no sale. */
export function priceLadder(startPrice, floorPrice, plan, maxSteps = 12) {
  const floor = Math.max(0, Number(floorPrice) || 0);
  const steps = [{ day: 0, price: Number(startPrice) }];
  let price = Number(startPrice);
  for (let i = 1; i <= maxSteps && price > floor; i++) {
    const next = dropTarget(price, floor, plan.dropPct);
    if (next == null) break;
    price = next;
    steps.push({ day: i * plan.dropEveryDays, price });
  }
  return steps;
}

function dropTarget(price, floor, dropPct) {
  let next = Math.max(floor, nicePrice(price * (1 - dropPct)));
  if (next >= price) next = price > floor ? floor : price;
  return next < price ? next : null;
}

/**
 * Evaluates one listing and returns the actions that are due now.
 * @param {object} listing
 * @param {Date} now
 * @param {{pendingTypes?: Set<string>, thresholds?: object}} [ctx]
 */
export function evaluateListing(listing, now = new Date(), ctx = {}) {
  if (!listing || listing.status !== 'active') return [];
  const plan = listing.plan || buildPlan('balanced');
  const t = { ...DEFAULT_THRESHOLDS, ...(ctx.thresholds || {}) };
  const pending = ctx.pendingTypes || new Set();
  const nowMs = now.getTime();
  const stats = listing.stats || {};
  const messages = Number(stats.messages) || 0;
  const views = stats.views == null ? null : Number(stats.views);
  const price = Number(listing.price);
  const floor = Math.max(0, Number(listing.floorPrice) || 0);

  const posted = ts(listing.postedAt) || nowMs;
  const freshStart = Math.max(posted, ts(listing.lastRelistAt));
  const ageDays = daysBetween(freshStart, nowMs);
  const lastVisibility = Math.max(freshStart, ts(listing.lastRenewedAt));
  const lastPriceChange = Math.max(freshStart, ts(listing.lastPriceChangeAt));
  const hot = messages >= t.hotMessages;
  const lowTraffic = messages === 0 || (views != null && views < t.lowViews);

  const actions = [];
  const add = (type, payload, reason) => {
    if (pending.has(type)) return;
    actions.push({
      type,
      payload,
      reason,
      requiresApproval: !plan.autoApprove?.[type],
      scheduledFor: nextPrimeTime(now).toISOString(),
    });
  };

  // 1. Relist: an old ad sinks in search even when renewed. A fresh copy
  //    (new title wording, new cover photo) resets its ranking.
  const relistDue =
    ageDays >= plan.relistAfterDays && (listing.renewCount || 0) >= 1 && !hot;
  if (relistDue) {
    add('relist', { refreshCopy: true, rotateCoverPhoto: true },
      `En ligne depuis ${Math.floor(ageDays)} jours sans vente : republier une version rafraîchie remet l'annonce en tête des résultats.`);
  }

  // 2. Renew: Facebook offers "Renouveler" on listings older than ~7 days.
  if (!relistDue && daysBetween(lastVisibility, nowMs) >= plan.renewEveryDays) {
    add('renew', {}, `Dernière relance il y a ${Math.floor(daysBetween(lastVisibility, nowMs))} jours : renouveler remonte l'annonce dans le fil.`);
  }

  // 3. Price drop — only when buyers aren't biting and we're above the floor.
  if (!hot && price > floor && daysBetween(lastPriceChange, nowMs) >= plan.dropEveryDays) {
    const newPrice = dropTarget(price, floor, plan.dropPct);
    if (newPrice != null) {
      const why = messages === 0
        ? `Aucun message en ${Math.floor(daysBetween(lastPriceChange, nowMs))} jours`
        : `Seulement ${messages} message(s)`;
      add('price_drop', { from: price, to: newPrice, floor },
        `${why} : baisser de ${price} $ à ${newPrice} $ (plancher ${floor} $). Facebook notifie les personnes qui ont enregistré l'annonce lors d'une baisse.`);
    }
  }

  // 4. Boost (paid) — worth it for higher-value items with a visibility problem.
  const boost = plan.boost || {};
  const lastBoost = ts(listing.lastBoostAt);
  const boostCooldown = ((boost.days || 3) + 7) * DAY;
  if (
    boost.enabled && price >= (boost.minPrice || 0) && ageDays >= 2 && lowTraffic &&
    (!lastBoost || nowMs - lastBoost >= boostCooldown)
  ) {
    add('boost', { dailyBudget: boost.dailyBudget, days: boost.days, total: boost.dailyBudget * boost.days },
      `Peu de visibilité${views != null ? ` (${views} vues)` : ''} sur un article de ${price} $ : un boost de ${boost.dailyBudget} $/jour pendant ${boost.days} jours peut multiplier les vues.`);
  }

  // 5. Stuck at the floor: tell the owner rather than acting on their behalf.
  if (!hot && price <= floor && ageDays >= plan.dropEveryDays * 2) {
    add('advice', { kind: 'at_floor' },
      'Au prix plancher sans vente : refais la photo principale (lumière naturelle, fond neutre), ajoute des détails (dimensions, modèle exact) ou revois le plancher.');
  }
  return actions;
}

/** Applies a completed action to the listing (returns an updated copy). */
export function applyCompletedAction(listing, action, now = new Date()) {
  const at = now.toISOString();
  const next = { ...listing, priceHistory: [...(listing.priceHistory || [])] };
  switch (action.type) {
    case 'renew':
      next.lastRenewedAt = at;
      next.renewCount = (listing.renewCount || 0) + 1;
      break;
    case 'price_drop':
      next.price = action.payload.to;
      next.lastPriceChangeAt = at;
      next.priceHistory.push({ price: action.payload.to, at, reason: 'price_drop' });
      break;
    case 'relist':
      next.lastRelistAt = at;
      next.lastRenewedAt = at;
      next.renewCount = 0;
      next.relistCount = (listing.relistCount || 0) + 1;
      if (action.result?.fbId) next.fbId = action.result.fbId;
      break;
    case 'boost':
      next.lastBoostAt = at;
      break;
    default:
      break;
  }
  return next;
}
