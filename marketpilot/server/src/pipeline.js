// "Mode éclair": photos in, finished ad out.
//
//   analyzing ──▶ writing ──▶ awaiting_market ──▶ ready
//        └──────────┴──────────────┴──────▶ error (retryable)
//
// The server does the AI steps as soon as photos arrive. The market scan
// needs a logged-in browser, so the extension picks up drafts sitting in
// `awaiting_market`, scans Marketplace and posts the comparables back; the
// pipeline then prices the draft from the owner's chosen strategy.

import { analyzeMarket, nicePrice } from './pricing.js';
import { titleSimilarity } from './similarity.js';
import { getCategory } from './categories.js';

export const STAGES = ['analyzing', 'writing', 'awaiting_market', 'ready', 'error'];

// Which market strategy sets the price for each selling mode, and which one
// becomes the floor (one notch below).
const MODE_STRATEGY = {
  fast: { price: 'fast', floorFactor: 0.85 },
  balanced: { price: 'market', floor: 'fast' },
  max: { price: 'max', floor: 'market' },
};

// Typical used price as a share of retail when no comparables are found.
const CONDITION_FACTOR = { new: 0.75, used_like_new: 0.6, used_good: 0.45, used_fair: 0.3 };

export function choosePrice(market, mode = 'balanced') {
  const rule = MODE_STRATEGY[mode] || MODE_STRATEGY.balanced;
  const byId = Object.fromEntries((market.strategies || []).map((s) => [s.id, s]));
  const chosen = byId[rule.price];
  if (!chosen) return null;
  const floor = rule.floor ? byId[rule.floor]?.price : nicePrice(chosen.price * rule.floorFactor);
  return { price: chosen.price, floorPrice: Math.min(floor ?? chosen.price, chosen.price), strategyId: chosen.id };
}

export function estimateFromRetail(item) {
  const retail = Number(item?.estimatedRetailPrice);
  if (!(retail > 0)) return null;
  const price = nicePrice(retail * (CONDITION_FACTOR[item.conditionId] ?? 0.45));
  return { price, floorPrice: nicePrice(price * 0.8), strategyId: 'retail_estimate' };
}

export function createPipeline({ store, ai, photos, notifier, publicUrl, concurrency = 2, log = console }) {
  const queue = [];
  const active = new Set();
  let idleWaiters = [];

  const setStage = (id, stage, extra = {}) => store.update('listings', id, (l) => ({
    ...l,
    ...extra,
    pipeline: { ...(l.pipeline || {}), stage, error: stage === 'error' ? extra.error ?? l.pipeline?.error : null, updatedAt: new Date().toISOString() },
  }));

  async function runAI(id) {
    const listing = store.get('listings', id);
    if (!listing) return;
    if (!ai) throw new Error('IA non configurée (ANTHROPIC_API_KEY manquante).');

    if (!listing.item) {
      await setStage(id, 'analyzing');
      const images = await photos.readForAI(listing.photos);
      if (!images.length) throw new Error('Aucune photo pour cet article.');
      const item = await ai.analyzeItem({ images, notes: listing.notes || '' });
      const ordered = [...listing.photos];
      if (item.coverPhotoIndex > 0 && ordered[item.coverPhotoIndex]) ordered.unshift(...ordered.splice(item.coverPhotoIndex, 1));
      await store.update('listings', id, {
        item,
        photos: ordered,
        title: item.itemName,
        categoryId: getCategory(item.categoryId).id,
        conditionId: item.conditionId,
      });
    }

    const current = store.get('listings', id);
    if (!current.copyWritten) {
      await setStage(id, 'writing');
      const copy = await ai.writeListing({
        item: current.item,
        price: null,
        negotiable: current.negotiable ?? true,
        pickupArea: current.pickupArea || '',
        delivery: current.delivery ?? false,
        extraNotes: current.notes || '',
        tone: current.tone || 'friendly',
        lang: current.lang || 'fr',
      });
      await store.update('listings', id, {
        title: copy.title,
        description: copy.description,
        alternateTitles: copy.alternateTitles,
        copyWritten: true,
      });
    }
    await setStage(id, 'awaiting_market');
  }

  function drain() {
    while (active.size < concurrency && queue.length) {
      const id = queue.shift();
      const job = runAI(id)
        .catch(async (err) => {
          log.error?.(`[pipeline] ${id}:`, err.message);
          await setStage(id, 'error', { error: err.message }).catch(() => {});
        })
        .finally(() => {
          active.delete(job);
          drain();
          if (!active.size && !queue.length) { idleWaiters.forEach((r) => r()); idleWaiters = []; }
        });
      active.add(job);
    }
  }

  return {
    enqueue(id) {
      if (!queue.includes(id)) queue.push(id);
      drain();
    },

    /** Resolves when no job is running (used by tests and graceful shutdown). */
    idle() {
      if (!active.size && !queue.length) return Promise.resolve();
      return new Promise((resolve) => idleWaiters.push(resolve));
    },

    /** Restart drafts interrupted by a server restart. */
    resume() {
      for (const l of store.list('listings', (x) => x.status === 'draft' && ['analyzing', 'writing'].includes(x.pipeline?.stage))) this.enqueue(l.id);
    },

    async retry(id) {
      const l = store.get('listings', id);
      if (!l) return false;
      if (l.item && l.copyWritten && l.pipeline?.stage === 'error') {
        // AI steps are done; only the market scan failed.
        await setStage(id, 'awaiting_market');
      } else {
        this.enqueue(id);
      }
      return true;
    },

    /**
     * Prices a draft from scanned comparables (or from the retail estimate
     * when the market is empty) and marks it ready.
     */
    async completeMarket(id, scanned, { matcher } = {}) {
      const listing = store.get('listings', id);
      if (!listing) return null;
      const item = listing.item || {};
      const queries = [item.itemName, [item.brand, item.model].filter(Boolean).join(' '), ...(item.searchQueries || [])].filter((q) => q?.trim());
      let enriched = scanned;
      if (matcher && scanned.length) {
        const candidates = scanned
          .map((l, idx) => ({ ...l, idx, sim: Math.max(0, ...queries.map((q) => titleSimilarity(l.title, q))) }))
          .sort((a, b) => b.sim - a.sim)
          .slice(0, 60);
        try {
          const { matches } = await matcher({ item, comparables: candidates.map((c) => ({ title: c.title, price: c.price })) });
          const verdicts = new Map(matches.map((m) => [candidates[m.index]?.idx, m.match]));
          enriched = scanned.map((l, idx) => ({ ...l, match: verdicts.get(idx) ?? (candidates.some((c) => c.idx === idx) ? undefined : 'different') }));
        } catch (err) {
          log.warn?.('[pipeline] comparaison IA impossible, repli lexical :', err.message);
        }
      }
      const market = analyzeMarket(enriched, { queries });
      const mode = listing.plan?.mode || 'balanced';
      const pick = (market.stats && choosePrice(market, mode)) || estimateFromRetail(item);

      const updated = await store.update('listings', id, (l) => ({
        ...l,
        market: {
          stats: market.stats,
          confidence: market.confidence,
          usedCount: market.usedCount,
          identicalCount: market.identicalCount,
          comparables: market.comparables.slice(0, 12),
          scannedAt: new Date().toISOString(),
        },
        priceOptions: market.strategies.map(({ id: sid, label, price, daysToSell, listWithMargin }) => ({ id: sid, label, price, daysToSell, listWithMargin })),
        ...(pick ? { price: pick.price, startPrice: pick.price, floorPrice: pick.floorPrice, priceSource: pick.strategyId } : {}),
        priceHistory: pick ? [{ price: pick.price, at: new Date().toISOString(), reason: 'initial' }] : l.priceHistory,
        pipeline: {
          ...(l.pipeline || {}),
          stage: pick ? 'ready' : 'error',
          error: pick ? null : 'Aucun comparable trouvé et pas de prix neuf connu : entre un prix manuellement.',
          updatedAt: new Date().toISOString(),
        },
      }));

      if (pick && notifier?.enabled) {
        await notifier.send({
          title: 'Annonce prête ⚡',
          message: `${updated.title} — ${updated.price} $${market.stats ? ` (médiane du marché ${market.stats.median} $)` : ' (estimation)'}`,
          click: `${publicUrl}/m/lot`,
          tags: ['zap'],
        });
      }
      return updated;
    },
  };
}
