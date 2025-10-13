#!/usr/bin/env node
// Exécute chaque jour: pour chaque rivière, calcule et stocke un snapshot (météo+hydro+hatches)
const db = require('../utils/db');
const { fetchDailySummary } = require('../services/enrichment/weatherProvider');
const { fetchDailyHydro } = require('../services/enrichment/hydroProvider');
const { inferHatches } = require('../services/enrichment/hatchesProvider');

async function riverCentroid(river) {
  // TODO: si bbox_geom dispo, calcule centroid. Ici: placeholder sur geom des pools ou null.
  return { lat: river.lat || 48.5, lon: river.lon || -68.5 };
}

(async ()=>{
  const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD (UTC)
  const rivers = await db.manyOrNone(`SELECT id, slug, name_fr, name_en FROM rivers`);
  
  console.log(`🌊 Génération des snapshots pour ${rivers.length} rivières - ${today}`);
  
  for (const r of rivers) {
    try {
      const { lat, lon } = await riverCentroid(r);
      const weather = await fetchDailySummary(lat, lon, today);
      const hydro = await fetchDailyHydro(r);
      const hatches = inferHatches(r, today);
      
      await db.none(`
        INSERT INTO river_daily_snapshots(river_id, date, weather_json, hydro_json, hatches_json)
        VALUES(?,?,?,?,?)
        ON CONFLICT (river_id, date) DO UPDATE
        SET weather_json=EXCLUDED.weather_json, hydro_json=EXCLUDED.hydro_json, hatches_json=EXCLUDED.hatches_json
      `, [r.id, today, JSON.stringify(weather), JSON.stringify(hydro), JSON.stringify(hatches)]);
      
      console.log(`✅ ${r.slug}: météo=${weather ? 'OK' : 'N/A'}, hydro=${hydro ? 'OK' : 'N/A'}, éclosions=${hatches ? 'OK' : 'N/A'}`);
      
    } catch (error) {
      console.error(`❌ Erreur snapshot ${r.slug}:`, error.message);
    }
  }
  
  console.log(`🎉 Snapshots ${today} terminés`);
  process.exit(0);
})().catch(e=>{ 
  console.error('❌ Erreur worker snapshots:', e); 
  process.exit(1); 
});



