import express from 'express';
import multer from 'multer';
import QRCode from 'qrcode';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import { newId } from './store.js';
import { analyzeMarket } from './pricing.js';
import { titleSimilarity } from './similarity.js';
import { CATEGORIES, CONDITIONS, getCategory, getCondition } from './categories.js';
import { PLAN_PRESETS, buildPlan, priceLadder, applyCompletedAction } from './strategy.js';
import { runStrategy } from './scheduler.js';
import { AIRefusalError } from './ai.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(here, '..', 'public');
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function validate(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  return parsed.data;
}

/**
 * @param {{store, ai?, notifier?, config}} deps
 */
export function createApp({ store, ai, notifier, config }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));

  // CORS: the extension (chrome-extension://) and the mobile pages call the API.
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  const requireToken = (req, _res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token || !safeEqual(token, config.apiToken)) return next(new HttpError(401, 'Jeton invalide'));
    next();
  };

  const requireAI = () => {
    if (!ai) throw new HttpError(503, 'IA non configurée (ANTHROPIC_API_KEY manquante).');
    return ai;
  };

  const photoDir = (sessionId) => path.join(config.dataDir, 'uploads', sessionId);
  const photoPath = (sessionId, photo) => path.join(photoDir(sessionId), `${photo.id}.${IMAGE_TYPES[photo.mediaType]}`);

  function getSession(id) {
    const session = store.get('sessions', id);
    if (!session) throw new HttpError(404, 'Session introuvable');
    return session;
  }

  const publicSession = (s) => ({
    id: s.id,
    createdAt: s.createdAt,
    photos: s.photos.map((p) => ({ id: p.id, mediaType: p.mediaType, size: p.size, url: `/api/sessions/${s.id}/photos/${p.id}` })),
  });

  // ---------------------------------------------------------------- public
  app.get('/api/health', (_req, res) => res.json({ ok: true, ai: Boolean(ai), notifications: Boolean(notifier?.enabled) }));
  app.get('/m/s/:id', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'mobile.html')));
  app.get('/m/approvals', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'approvals.html')));
  app.use('/m/assets', express.static(path.join(PUBLIC_DIR, 'assets'), { maxAge: '1h' }));

  // Phone upload — authenticated by the per-session upload token (from the QR code).
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024, files: config.maxPhotosPerSession },
  });
  app.post('/m/api/sessions/:id/photos', upload.array('photos', config.maxPhotosPerSession), wrap(async (req, res) => {
    const session = getSession(req.params.id);
    const token = req.headers['x-upload-token'] || '';
    if (!safeEqual(token, session.uploadToken)) throw new HttpError(401, 'Lien de téléversement invalide');
    if (Date.now() - new Date(session.createdAt).getTime() > 24 * 3600 * 1000) throw new HttpError(410, 'Lien expiré — génère un nouveau code QR.');
    const files = req.files || [];
    if (!files.length) throw new HttpError(400, 'Aucune photo reçue');
    if (session.photos.length + files.length > config.maxPhotosPerSession) {
      throw new HttpError(400, `Maximum ${config.maxPhotosPerSession} photos par annonce`);
    }
    await fs.mkdir(photoDir(session.id), { recursive: true });
    const added = [];
    for (const file of files) {
      if (!IMAGE_TYPES[file.mimetype]) throw new HttpError(415, `Format non supporté : ${file.mimetype}`);
      const photo = { id: newId('pho'), mediaType: file.mimetype, size: file.size, createdAt: new Date().toISOString() };
      await fs.writeFile(photoPath(session.id, photo), file.buffer);
      added.push(photo);
    }
    const updated = await store.update('sessions', session.id, (s) => ({ ...s, photos: [...s.photos, ...added] }));
    res.json({ count: updated.photos.length });
  }));

  // ---------------------------------------------------------------- private
  const api = express.Router();
  api.use(requireToken);

  api.get('/meta', (_req, res) => res.json({ categories: CATEGORIES, conditions: CONDITIONS, planPresets: PLAN_PRESETS }));

  api.post('/sessions', wrap(async (_req, res) => {
    const session = { id: newId('ses'), uploadToken: crypto.randomBytes(18).toString('base64url'), photos: [], createdAt: new Date().toISOString() };
    await store.insert('sessions', session);
    // Token in the #fragment: never sent to the server logs or proxies.
    const mobileUrl = `${config.publicUrl}/m/s/${session.id}#t=${session.uploadToken}`;
    const qrSvg = await QRCode.toString(mobileUrl, { type: 'svg', margin: 1, width: 220 });
    res.json({ ...publicSession(session), mobileUrl, qrSvg });
  }));

  api.get('/sessions/:id', (req, res) => res.json(publicSession(getSession(req.params.id))));

  api.get('/sessions/:id/photos/:photoId', wrap(async (req, res) => {
    const session = getSession(req.params.id);
    const photo = session.photos.find((p) => p.id === req.params.photoId);
    if (!photo) throw new HttpError(404, 'Photo introuvable');
    res.type(photo.mediaType).sendFile(photoPath(session.id, photo));
  }));

  api.delete('/sessions/:id/photos/:photoId', wrap(async (req, res) => {
    const session = getSession(req.params.id);
    const photo = session.photos.find((p) => p.id === req.params.photoId);
    if (!photo) throw new HttpError(404, 'Photo introuvable');
    await fs.rm(photoPath(session.id, photo), { force: true });
    const updated = await store.update('sessions', session.id, (s) => ({ ...s, photos: s.photos.filter((p) => p.id !== photo.id) }));
    res.json(publicSession(updated));
  }));

  api.post('/sessions/:id/order', wrap(async (req, res) => {
    const { photoIds } = validate(z.object({ photoIds: z.array(z.string()) }), req.body);
    const session = getSession(req.params.id);
    const byId = new Map(session.photos.map((p) => [p.id, p]));
    const ordered = [...photoIds.filter((id) => byId.has(id)).map((id) => byId.get(id)), ...session.photos.filter((p) => !photoIds.includes(p.id))];
    const updated = await store.update('sessions', session.id, (s) => ({ ...s, photos: ordered }));
    res.json(publicSession(updated));
  }));

  api.post('/analyze', wrap(async (req, res) => {
    const { sessionId, notes } = validate(z.object({ sessionId: z.string(), notes: z.string().optional() }), req.body);
    const session = getSession(sessionId);
    if (!session.photos.length) throw new HttpError(400, 'Ajoute au moins une photo');
    const images = await Promise.all(session.photos.slice(0, 6).map(async (p) => ({
      mediaType: p.mediaType,
      data: (await fs.readFile(photoPath(session.id, p))).toString('base64'),
    })));
    const item = await requireAI().analyzeItem({ images, notes });
    res.json({ item, category: getCategory(item.categoryId), condition: getCondition(item.conditionId) });
  }));

  const CopyInput = z.object({
    item: z.record(z.string(), z.any()),
    price: z.number().nonnegative(),
    negotiable: z.boolean().optional(),
    pickupArea: z.string().optional(),
    delivery: z.boolean().optional(),
    extraNotes: z.string().optional(),
    tone: z.enum(['friendly', 'firm', 'short']).optional(),
    lang: z.enum(['fr', 'en']).optional(),
    avoidTitles: z.array(z.string()).optional(),
  });
  api.post('/copy', wrap(async (req, res) => {
    res.json(await requireAI().writeListing(validate(CopyInput, req.body)));
  }));

  const PricingInput = z.object({
    item: z.object({ itemName: z.string(), brand: z.string().nullable().optional(), model: z.string().nullable().optional(), searchQueries: z.array(z.string()).optional() }).passthrough(),
    listings: z.array(z.object({ title: z.string(), price: z.any(), url: z.string().optional(), location: z.string().optional(), image: z.string().optional() })),
    desiredPrice: z.number().nullable().optional(),
    useAI: z.boolean().optional(),
  });
  api.post('/pricing', wrap(async (req, res) => {
    const { item, listings, desiredPrice, useAI = true } = validate(PricingInput, req.body);
    const queries = [item.itemName, [item.brand, item.model].filter(Boolean).join(' '), ...(item.searchQueries || [])].filter((q) => q && q.trim());
    let enriched = listings;
    if (useAI && ai && listings.length) {
      // Only send the lexically plausible candidates to the model.
      const candidates = listings
        .map((l, idx) => ({ ...l, idx, sim: Math.max(...queries.map((q) => titleSimilarity(l.title, q))) }))
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 60);
      const { matches } = await ai.matchComparables({ item, comparables: candidates.map((c) => ({ title: c.title, price: c.price })) });
      const verdicts = new Map(matches.map((m) => [candidates[m.index]?.idx, m.match]));
      enriched = listings.map((l, idx) => ({ ...l, match: verdicts.get(idx) || (candidates.some((c) => c.idx === idx) ? undefined : 'different') }));
    }
    res.json(analyzeMarket(enriched, { queries, desiredPrice }));
  }));

  api.post('/reply', wrap(async (req, res) => {
    const { listingId, buyerMessage, lang } = validate(z.object({ listingId: z.string(), buyerMessage: z.string().min(1), lang: z.enum(['fr', 'en']).optional() }), req.body);
    const listing = store.get('listings', listingId);
    if (!listing) throw new HttpError(404, 'Annonce introuvable');
    res.json(await requireAI().draftReply({ listing, buyerMessage, floorPrice: listing.floorPrice, lang }));
  }));

  // ----------------------------------------------------------- listings
  const PlanInput = z.object({
    mode: z.enum(['fast', 'balanced', 'max']).optional(),
    dropPct: z.number().min(0.01).max(0.5).optional(),
    dropEveryDays: z.number().min(1).max(60).optional(),
    renewEveryDays: z.number().min(1).max(60).optional(),
    relistAfterDays: z.number().min(3).max(180).optional(),
    boost: z.object({ enabled: z.boolean().optional(), minPrice: z.number().optional(), dailyBudget: z.number().min(1).optional(), days: z.number().int().min(1).max(30).optional() }).optional(),
    autoApprove: z.object({ renew: z.boolean().optional(), price_drop: z.boolean().optional(), relist: z.boolean().optional(), boost: z.boolean().optional() }).optional(),
  });
  const ListingInput = z.object({
    title: z.string().min(1).max(150),
    description: z.string().max(5000).default(''),
    price: z.number().nonnegative(),
    floorPrice: z.number().nonnegative().optional(),
    categoryId: z.string().default('misc'),
    conditionId: z.string().default('used_good'),
    pickupArea: z.string().optional(),
    sessionId: z.string().optional(),
    item: z.record(z.string(), z.any()).optional(),
    alternateTitles: z.array(z.string()).optional(),
    market: z.record(z.string(), z.any()).nullable().optional(),
    plan: PlanInput.optional(),
  });

  async function cancelOpenActions(listingId) {
    for (const a of store.list('actions', (x) => x.listingId === listingId && ['pending', 'approved'].includes(x.status))) {
      await store.update('actions', a.id, { status: 'cancelled' });
    }
  }

  const withLadder = (l) => ({ ...l, ladder: priceLadder(l.price, l.floorPrice, l.plan) });

  api.get('/listings', (_req, res) => {
    res.json(store.list('listings').sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(withLadder));
  });

  api.get('/listings/:id', (req, res) => {
    const listing = store.get('listings', req.params.id);
    if (!listing) throw new HttpError(404, 'Annonce introuvable');
    res.json(withLadder(listing));
  });

  api.post('/listings', wrap(async (req, res) => {
    const input = validate(ListingInput, req.body);
    const { mode = 'balanced', ...overrides } = input.plan || {};
    const photos = input.sessionId ? getSession(input.sessionId).photos.map((p) => ({ sessionId: input.sessionId, id: p.id })) : [];
    const floorPrice = Math.min(input.floorPrice ?? input.price, input.price);
    const now = new Date().toISOString();
    const listing = {
      id: newId('lst'),
      ...input,
      categoryId: getCategory(input.categoryId).id,
      conditionId: getCondition(input.conditionId).id,
      floorPrice,
      startPrice: input.price,
      photos,
      plan: buildPlan(mode, overrides),
      status: 'draft',
      stats: { views: null, saves: null, messages: 0 },
      priceHistory: [{ price: input.price, at: now, reason: 'initial' }],
      renewCount: 0,
      relistCount: 0,
      snoozed: {},
      createdAt: now,
    };
    delete listing.sessionId;
    await store.insert('listings', listing);
    res.status(201).json(withLadder(listing));
  }));

  const ListingPatch = z.object({
    title: z.string().min(1).max(150).optional(),
    description: z.string().max(5000).optional(),
    price: z.number().nonnegative().optional(),
    floorPrice: z.number().nonnegative().optional(),
    status: z.enum(['draft', 'active', 'pending', 'sold', 'archived']).optional(),
    fbId: z.string().optional(),
    fbUrl: z.string().optional(),
    soldPrice: z.number().nonnegative().optional(),
    stats: z.object({ views: z.number().nullable().optional(), saves: z.number().nullable().optional(), messages: z.number().optional() }).optional(),
    plan: PlanInput.optional(),
  });
  api.patch('/listings/:id', wrap(async (req, res) => {
    const patch = validate(ListingPatch, req.body);
    const updated = await store.update('listings', req.params.id, (l) => {
      const next = { ...l, ...patch, stats: { ...l.stats, ...(patch.stats || {}) } };
      if (patch.plan) {
        const { mode = l.plan.mode, ...overrides } = patch.plan;
        // Switching mode resets the cadence to the new preset; boost and
        // approval preferences are kept.
        const { mode: _old, boost, autoApprove, ...cadence } = l.plan;
        next.plan = buildPlan(mode, {
          ...(mode === l.plan.mode ? cadence : {}),
          ...overrides,
          boost: { ...boost, ...(overrides.boost || {}) },
          autoApprove: { ...autoApprove, ...(overrides.autoApprove || {}) },
        });
      }
      if (patch.price != null && patch.price !== l.price) {
        next.priceHistory = [...(l.priceHistory || []), { price: patch.price, at: new Date().toISOString(), reason: 'manual' }];
        next.lastPriceChangeAt = new Date().toISOString();
      }
      if (patch.status === 'active' && !l.postedAt) next.postedAt = new Date().toISOString();
      if (patch.status === 'sold' && !l.soldAt) next.soldAt = new Date().toISOString();
      return next;
    });
    if (!updated) throw new HttpError(404, 'Annonce introuvable');
    if (['sold', 'archived'].includes(updated.status)) await cancelOpenActions(updated.id);
    res.json(withLadder(updated));
  }));

  api.delete('/listings/:id', wrap(async (req, res) => {
    if (!(await store.remove('listings', req.params.id))) throw new HttpError(404, 'Annonce introuvable');
    res.json({ ok: true });
  }));

  // Selling page scrape from the extension: attach Facebook ids and refresh stats.
  const SyncInput = z.object({
    items: z.array(z.object({
      fbId: z.string().regex(/^\d+$/).optional(),
      title: z.string(),
      price: z.number().nullable().optional(),
      status: z.enum(['active', 'pending', 'sold']).optional(),
      views: z.number().nullable().optional(),
      messages: z.number().nullable().optional(),
      url: z.string().optional(),
    })),
  });
  api.post('/listings/sync', wrap(async (req, res) => {
    const { items } = validate(SyncInput, req.body);
    const results = [];
    for (const item of items) {
      let listing = item.fbId ? store.list('listings', (l) => l.fbId === item.fbId)[0] : null;
      if (!listing) {
        // Without an id, also match already-linked listings (selling page cards may lack links).
        const candidates = store.list('listings', (l) => (item.fbId ? !l.fbId : true) && ['draft', 'active', 'pending'].includes(l.status))
          .map((l) => ({ l, score: titleSimilarity(l.title, item.title) }))
          .filter((c) => c.score >= 0.6)
          .sort((a, b) => b.score - a.score);
        listing = candidates[0]?.l;
      }
      if (!listing) { results.push({ fbId: item.fbId, matched: false }); continue; }
      await store.update('listings', listing.id, (l) => ({
        ...l,
        fbId: item.fbId || l.fbId,
        fbUrl: item.url || l.fbUrl || (item.fbId ? `https://www.facebook.com/marketplace/item/${item.fbId}/` : undefined),
        status: item.status === 'sold' ? 'sold' : item.status === 'pending' ? 'pending' : ['draft', 'pending'].includes(l.status) ? 'active' : l.status,
        postedAt: l.postedAt || new Date().toISOString(),
        stats: {
          ...l.stats,
          ...(item.views != null ? { views: item.views } : {}),
          ...(item.messages != null ? { messages: item.messages } : {}),
          syncedAt: new Date().toISOString(),
        },
      }));
      if (item.status === 'sold' && listing.status !== 'sold') {
        await store.update('listings', listing.id, { soldAt: new Date().toISOString() });
        await cancelOpenActions(listing.id);
      }
      results.push({ fbId: item.fbId, matched: true, listingId: listing.id });
    }
    res.json({ results });
  }));

  // ------------------------------------------------------------ actions
  const enrichAction = (a) => {
    const l = store.get('listings', a.listingId);
    return { ...a, listing: l ? { id: l.id, title: l.title, price: l.price, floorPrice: l.floorPrice, fbId: l.fbId, fbUrl: l.fbUrl, status: l.status } : null };
  };

  api.get('/actions', (req, res) => {
    const statuses = String(req.query.status || 'pending,approved').split(',');
    res.json(store.list('actions', (a) => statuses.includes(a.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(enrichAction));
  });

  const getAction = (id) => {
    const action = store.get('actions', id);
    if (!action) throw new HttpError(404, 'Action introuvable');
    return action;
  };

  api.post('/actions/:id/approve', wrap(async (req, res) => {
    const { price } = validate(z.object({ price: z.number().positive().optional() }), req.body || {});
    const action = getAction(req.params.id);
    if (action.status !== 'pending') throw new HttpError(409, `Action déjà ${action.status}`);
    const patch = { status: action.type === 'advice' ? 'done' : 'approved', decidedAt: new Date().toISOString() };
    if (action.type === 'price_drop' && price != null) {
      const listing = store.get('listings', action.listingId);
      if (price < (listing?.floorPrice ?? 0)) throw new HttpError(400, `Sous le prix plancher (${listing.floorPrice} $)`);
      patch.payload = { ...action.payload, to: price };
    }
    res.json(enrichAction(await store.update('actions', action.id, patch)));
  }));

  api.post('/actions/:id/reject', wrap(async (req, res) => {
    const action = getAction(req.params.id);
    if (!['pending', 'approved'].includes(action.status)) throw new HttpError(409, `Action déjà ${action.status}`);
    const updated = await store.update('actions', action.id, { status: 'rejected', decidedAt: new Date().toISOString() });
    // Don't ask again right away: snooze this type for one plan interval.
    const listing = store.get('listings', action.listingId);
    if (listing) {
      const days = action.type === 'price_drop' ? listing.plan.dropEveryDays : action.type === 'advice' ? 7 : listing.plan.renewEveryDays;
      await store.update('listings', listing.id, (l) => ({ ...l, snoozed: { ...(l.snoozed || {}), [action.type]: new Date(Date.now() + days * 86400000).toISOString() } }));
    }
    res.json(enrichAction(updated));
  }));

  api.post('/actions/:id/complete', wrap(async (req, res) => {
    const { result } = validate(z.object({ result: z.record(z.string(), z.any()).optional() }), req.body || {});
    const action = getAction(req.params.id);
    if (action.status !== 'approved') throw new HttpError(409, 'Seules les actions approuvées peuvent être complétées');
    const done = await store.update('actions', action.id, { status: 'done', result: result || {}, completedAt: new Date().toISOString() });
    const listing = store.get('listings', action.listingId);
    if (listing) await store.update('listings', listing.id, applyCompletedAction(listing, done));
    res.json(enrichAction(done));
  }));

  api.post('/actions/:id/fail', wrap(async (req, res) => {
    const { error } = validate(z.object({ error: z.string() }), req.body || {});
    const action = getAction(req.params.id);
    const attempts = (action.attempts || 0) + 1;
    // Keep it approved for a retry unless it keeps failing.
    const updated = await store.update('actions', action.id, { attempts, lastError: error, status: attempts >= 3 ? 'failed' : action.status });
    res.json(enrichAction(updated));
  }));

  api.post('/strategy/run', wrap(async (_req, res) => {
    const created = await runStrategy({ store, notifier, publicUrl: config.publicUrl });
    res.json({ created: created.map(enrichAction) });
  }));

  // QR codes for the extension (it can't load a QR library from a CDN in MV3).
  api.post('/qr', wrap(async (req, res) => {
    const { text } = validate(z.object({ text: z.string().min(1).max(2000) }), req.body);
    res.json({ svg: await QRCode.toString(text, { type: 'svg', margin: 1, width: 220 }) });
  }));

  api.post('/notify/test', wrap(async (_req, res) => {
    if (!notifier?.enabled) throw new HttpError(400, 'NTFY_TOPIC non configuré');
    const ok = await notifier.send({ title: 'MarketPilot', message: 'Les notifications fonctionnent ✅', click: `${config.publicUrl}/m/approvals` });
    res.json({ ok });
  }));

  app.use('/api', api);

  app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
    if (err instanceof AIRefusalError) return res.status(422).json({ error: err.message });
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Erreur serveur' : err.message });
  });

  return app;
}
