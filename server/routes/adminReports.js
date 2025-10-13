const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { requireRole } = require('../utils/auth');

// Helper: log admin access
async function logAccess(user_id, endpoint, params = {}) {
  try {
    await db.none(`
      INSERT INTO admin_access_log(user_id, endpoint, params, ip, ua, created_at)
      VALUES(?, ?, ?, ?, ?, datetime('now'))
    `, [user_id, endpoint, JSON.stringify(params), '127.0.0.1', 'admin-api']);
  } catch (e) {
    console.warn('Failed to log admin access:', e);
  }
}

// GET /api/admin/reports/summary - CPUE et tailles par rivière
router.get('/summary', requireRole(['admin', 'super_admin']), async (req, res) => {
  const { from, to, river_slug } = req.query;
  
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (from) {
      whereClause += ' AND date_utc >= ?';
      params.push(from);
    }
    if (to) {
      whereClause += ' AND date_utc <= ?';
      params.push(to);
    }
    if (river_slug) {
      whereClause += ' AND river_slug = ?';
      params.push(river_slug);
    }
    
    const rows = await db.manyOrNone(`
      SELECT 
        river_slug,
        COUNT(*) as total_catches,
        COUNT(DISTINCT user_hash) as unique_fishers,
        AVG(length_cm) as avg_length,
        AVG(weight_kg) as avg_weight,
        MIN(length_cm) as min_length,
        MAX(length_cm) as max_length
      FROM dw_fact_catches
      ${whereClause}
      GROUP BY river_slug
      ORDER BY total_catches DESC
    `, params);
    
    await logAccess(req.user.uid, 'summary', { from, to, river_slug });
    res.json(rows);
  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({ error: 'Erreur rapport' });
  }
});

// GET /api/admin/reports/methods_flies - Distribution par méthode et mouche
router.get('/methods_flies', requireRole(['admin', 'super_admin']), async (req, res) => {
  const { river_slug, from, to } = req.query;
  
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (river_slug) {
      whereClause += ' AND river_slug = ?';
      params.push(river_slug);
    }
    if (from) {
      whereClause += ' AND date_utc >= ?';
      params.push(from);
    }
    if (to) {
      whereClause += ' AND date_utc <= ?';
      params.push(to);
    }
    
    const methods = await db.manyOrNone(`
      SELECT method, COUNT(*) as count
      FROM dw_fact_catches
      ${whereClause}
      GROUP BY method
      ORDER BY count DESC
    `, params);
    
    const flies = await db.manyOrNone(`
      SELECT fly_name_norm, COUNT(*) as count
      FROM dw_fact_catches
      ${whereClause} AND fly_name_norm != ''
      GROUP BY fly_name_norm
      ORDER BY count DESC
      LIMIT 20
    `, params);
    
    await logAccess(req.user.uid, 'methods_flies', { river_slug, from, to });
    res.json({ methods, flies });
  } catch (error) {
    console.error('Methods/flies report error:', error);
    res.status(500).json({ error: 'Erreur rapport' });
  }
});

// GET /api/admin/reports/weather_correlation - Corrélation météo vs succès
router.get('/weather_correlation', requireRole(['admin', 'super_admin']), async (req, res) => {
  const { river_slug } = req.query;
  
  try {
    let whereClause = 'WHERE weather_json IS NOT NULL';
    const params = [];
    
    if (river_slug) {
      whereClause += ' AND river_slug = ?';
      params.push(river_slug);
    }
    
    const rows = await db.manyOrNone(`
      SELECT 
        river_slug,
        COUNT(*) as total_catches,
        AVG(CAST(json_extract(weather_json, '$.temp_max') AS REAL)) as avg_temp_max,
        AVG(CAST(json_extract(weather_json, '$.wind_speed') AS REAL)) as avg_wind,
        AVG(CAST(json_extract(weather_json, '$.precip_mm') AS REAL)) as avg_precip,
        AVG(length_cm) as avg_length
      FROM dw_fact_catches
      ${whereClause}
      GROUP BY river_slug
      ORDER BY total_catches DESC
    `, params);
    
    await logAccess(req.user.uid, 'weather_correlation', { river_slug });
    res.json(rows);
  } catch (error) {
    console.error('Weather correlation error:', error);
    res.status(500).json({ error: 'Erreur rapport' });
  }
});

// GET /api/admin/reports/hourly_heatmap - Heatmap horaire
router.get('/hourly_heatmap', requireRole(['admin', 'super_admin']), async (req, res) => {
  const { river_slug, from, to } = req.query;
  
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (river_slug) {
      whereClause += ' AND river_slug = ?';
      params.push(river_slug);
    }
    if (from) {
      whereClause += ' AND date_utc >= ?';
      params.push(from);
    }
    if (to) {
      whereClause += ' AND date_utc <= ?';
      params.push(to);
    }
    
    const rows = await db.manyOrNone(`
      SELECT 
        river_slug,
        hour_bucket,
        COUNT(*) as catch_count,
        COUNT(DISTINCT user_hash) as fisher_count
      FROM dw_fact_catches
      ${whereClause}
      GROUP BY river_slug, hour_bucket
      ORDER BY river_slug, hour_bucket
    `, params);
    
    await logAccess(req.user.uid, 'hourly_heatmap', { river_slug, from, to });
    res.json(rows);
  } catch (error) {
    console.error('Hourly heatmap error:', error);
    res.status(500).json({ error: 'Erreur rapport' });
  }
});

// GET /api/admin/exports/csv - Export CSV des données anonymisées
router.get('/exports/csv', requireRole(['admin', 'super_admin']), async (req, res) => {
  const { from, to, river_slug } = req.query;
  
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (from) {
      whereClause += ' AND date_utc >= ?';
      params.push(from);
    }
    if (to) {
      whereClause += ' AND date_utc <= ?';
      params.push(to);
    }
    if (river_slug) {
      whereClause += ' AND river_slug = ?';
      params.push(river_slug);
    }
    
    const rows = await db.manyOrNone(`
      SELECT 
        river_slug,
        pool_bucket,
        date_utc,
        hour_bucket,
        species,
        method,
        fly_name_norm,
        length_cm,
        weight_kg,
        weather_json,
        hydro_json,
        hatches_json
      FROM dw_fact_catches
      ${whereClause}
      ORDER BY date_utc DESC, hour_bucket
      LIMIT 10000
    `, params);
    
    // Generate CSV
    const headers = ['river_slug', 'pool_bucket', 'date_utc', 'hour_bucket', 'species', 'method', 'fly_name_norm', 'length_cm', 'weight_kg'];
    let csv = headers.join(',') + '\n';
    
    for (const row of rows) {
      const values = headers.map(h => {
        const val = row[h];
        return val === null || val === undefined ? '' : `"${String(val).replace(/"/g, '""')}"`;
      });
      csv += values.join(',') + '\n';
    }
    
    await logAccess(req.user.uid, 'export_csv', { from, to, river_slug, row_count: rows.length });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fishing_data_${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Erreur export' });
  }
});

module.exports = router;



