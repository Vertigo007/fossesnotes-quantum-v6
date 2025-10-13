const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authRequired, requirePlan } = require('../utils/auth');

router.get('/courses', async (req,res)=>{
  const { visibility } = req.query; // public/pro/elite
  const rows = await db.manyOrNone(`
    SELECT * FROM classroom_courses
    WHERE ($1::text IS NULL OR visibility=$1)
    ORDER BY created_at DESC
  `, [visibility || null]);
  res.json(rows);
});

router.get('/courses/:slug', async (req,res)=>{
  const slug = req.params.slug;
  const course = await db.oneOrNone(`SELECT * FROM classroom_courses WHERE slug=$1`, [slug]);
  if (!course) return res.status(404).json({error:'not found'});
  const lessons = await db.manyOrNone(`SELECT * FROM classroom_lessons WHERE course_id=$1 ORDER BY order_index ASC`, [course.id]);
  res.json({ course, lessons });
});

// POST completion: +3 points (cap géré ailleurs)
router.post('/lessons/:id/complete', authRequired, async (req,res)=>{
  const id = Number(req.params.id);
  await db.none(`INSERT INTO gamification_points_ledger(user_id, action, delta) VALUES($1,'lesson.complete',3)`, [req.user.uid]);
  await db.none(`UPDATE users SET points_total = points_total + 3 WHERE id=$1`, [req.user.uid]);
  res.json({ ok:true });
});

module.exports = router;



