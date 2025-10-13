#!/usr/bin/env node
const crypto = require('crypto');
const db = require('../utils/db');

// Règles: inclure uniquement si user.consent_share=true ET privacy='community'
const SALT = process.env.DW_SALT || 'change-me';

function hashUser(id) { 
  return crypto.createHash('sha256').update(`${id}:${SALT}`).digest('hex').slice(0, 16); 
}

function hourBucket(d) { 
  return new Date(d).getUTCHours(); 
}

function normFly(s) { 
  return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}+/gu, ''); 
}

function poolBucketFromIds(river_id, pool_id) {
  // Sans coordonnées exactes: bucket par identifiants; plus tard, jitters géo.
  return pool_id ? `rv${river_id}-p${pool_id}` : `rv${river_id}-p0`;
}

(async () => {
  console.log('🔄 Début ETL anonymisation...');
  
  try {
    const rows = await db.manyOrNone(`
      SELECT c.id AS catch_id, c.caught_at, c.species, c.method, COALESCE(c.fly_name,'') AS fly_name,
             c.length_cm, c.weight_kg, c.enrich_weather, c.enrich_hydro, c.enrich_hatches,
             r.slug AS river_slug, c.river_id, c.pool_id, l.user_id, l.privacy, u.consent_share
      FROM fishing_catches c
      JOIN fishing_logs l ON l.id = c.log_id
      LEFT JOIN rivers r ON r.id = c.river_id
      JOIN users u ON u.id = l.user_id
      WHERE u.consent_share = 1 AND l.privacy = 'community'
        AND c.caught_at >= datetime('now', '-3 days')
    `);

    console.log(`📊 ${rows.length} prises à anonymiser`);

    for (const x of rows) {
      const user_hash = hashUser(x.user_id);
      const date_utc = new Date(x.caught_at).toISOString().slice(0, 10);
      const hour = hourBucket(x.caught_at);
      const pool_bucket = poolBucketFromIds(x.river_id, x.pool_id);
      
      await db.none(`
        INSERT INTO dw_fact_catches(river_slug, pool_bucket, date_utc, hour_bucket, species, method, fly_name_norm, length_cm, weight_kg, cpue_unit, weather_json, hydro_json, hatches_json, user_hash)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
      `, [
        x.river_slug || null, 
        pool_bucket, 
        date_utc, 
        hour, 
        x.species, 
        x.method, 
        normFly(x.fly_name), 
        x.length_cm, 
        x.weight_kg, 
        x.enrich_weather, 
        x.enrich_hydro, 
        x.enrich_hatches, 
        user_hash
      ]);
    }
    
    console.log(`✅ ETL anonymisation: ${rows.length} prises intégrées`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur ETL anonymisation:', error);
    process.exit(1);
  }
})().catch(e => { 
  console.error('❌ Erreur fatale ETL:', e); 
  process.exit(1); 
});



