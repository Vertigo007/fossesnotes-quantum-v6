// Runs the strategy engine over active listings, stores the proposals and
// pings the phone for the ones that need the owner's approval.

import { evaluateListing, buildPlan } from './strategy.js';
import { newId } from './store.js';

const OPEN = new Set(['pending', 'approved']);
const TYPE_LABELS = {
  renew: 'Relancer',
  price_drop: 'Baisse de prix',
  relist: 'Republier',
  boost: 'Booster',
  advice: 'Conseil',
};

export function describeAction(action, listing) {
  const label = TYPE_LABELS[action.type] || action.type;
  if (action.type === 'price_drop') return `${label} : ${listing.title} ${action.payload.from} $ → ${action.payload.to} $`;
  if (action.type === 'boost') return `${label} : ${listing.title} (${action.payload.total} $ au total)`;
  return `${label} : ${listing.title}`;
}

/** Payload the extension needs to republish a refreshed copy of the ad. */
function relistPayload(listing) {
  const titles = [listing.title, ...(listing.alternateTitles || [])].filter(Boolean);
  const nextTitle = titles[((listing.relistCount || 0) + 1) % titles.length] || listing.title;
  const photos = [...(listing.photos || [])];
  if (photos.length > 1) photos.push(photos.shift()); // new cover photo
  return { title: nextTitle, photos };
}

export async function runStrategy({ store, notifier, publicUrl, now = new Date() }) {
  const created = [];
  for (const listing of store.list('listings', (l) => l.status === 'active')) {
    const open = store.list('actions', (a) => a.listingId === listing.id && OPEN.has(a.status));
    const pendingTypes = new Set(open.map((a) => a.type));
    for (const [type, until] of Object.entries(listing.snoozed || {})) {
      if (new Date(until) > now) pendingTypes.add(type);
    }
    const proposals = evaluateListing({ ...listing, plan: listing.plan || buildPlan('balanced') }, now, { pendingTypes });
    for (const p of proposals) {
      if (p.type === 'relist') p.payload = { ...p.payload, ...relistPayload(listing) };
      const action = {
        id: newId('act'),
        listingId: listing.id,
        ...p,
        status: p.type === 'advice' ? 'pending' : p.requiresApproval ? 'pending' : 'approved',
        createdAt: now.toISOString(),
      };
      await store.insert('actions', action);
      created.push(action);
    }
  }

  const needsYou = created.filter((a) => a.status === 'pending');
  if (needsYou.length && notifier?.enabled) {
    const lines = needsYou.slice(0, 5).map((a) => `• ${describeAction(a, store.get('listings', a.listingId))}`);
    if (needsYou.length > 5) lines.push(`… et ${needsYou.length - 5} autre(s)`);
    await notifier.send({
      title: `MarketPilot : ${needsYou.length} décision(s) à prendre`,
      message: lines.join('\n'),
      click: `${publicUrl}/m/approvals`,
      tags: ['moneybag'],
    });
  }
  return created;
}

export function startScheduler(ctx, intervalMin) {
  const tick = () => runStrategy(ctx).catch((err) => console.error('[strategy]', err));
  const timer = setInterval(tick, intervalMin * 60 * 1000);
  timer.unref?.();
  setTimeout(tick, 5000).unref?.();
  return () => clearInterval(timer);
}
