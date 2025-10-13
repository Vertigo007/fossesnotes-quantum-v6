const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authRequired, requirePlan } = require('../utils/auth');

router.get('/', async (req,res)=>{
  const rows = await db.manyOrNone(`
    SELECT * FROM events WHERE status='published' ORDER BY start_at ASC
  `);
  res.json(rows);
});

// Elite peut proposer un event -> approval queue
router.post('/', authRequired, requirePlan('elite'), async (req,res)=>{
  const { slug, title_fr, title_en, description_fr, description_en, start_at, end_at, river_slug, location_text, lat, lon, visibility='pro', capacity } = req.body || {};
  const row = await db.one(`
    INSERT INTO events(slug,title_fr,title_en,description_fr,description_en,start_at,end_at,river_slug,location_text,lat,lon,host_id,visibility,capacity,status)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'draft')
    RETURNING *
  `, [slug, title_fr, title_en, description_fr, description_en, start_at, end_at, river_slug||null, location_text||null, lat||null, lon||null, req.user.uid, visibility, capacity||null]);
  res.json(row);
});

router.post('/:slug/rsvp', authRequired, async (req,res)=>{
  const slug = req.params.slug;
  const { status } = req.body || {};
  const ev = await db.oneOrNone(`SELECT id FROM events WHERE slug=$1 AND status='published'`, [slug]);
  if (!ev) return res.status(404).json({error:'event not found/published'});
  await db.none(`
    INSERT INTO events_rsvp(event_id,user_id,status) VALUES($1,$2,$3)
    ON CONFLICT(event_id,user_id) DO UPDATE SET status=EXCLUDED.status
  `, [ev.id, req.user.uid, status]);
  // points: attended (post-validation) → gérer via job si besoin
  res.json({ ok:true });
});

module.exports = router;



