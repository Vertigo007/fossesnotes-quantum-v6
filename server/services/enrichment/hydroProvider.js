// Adapters hydrométrie (placeholders) : Canada (ECCC WSC), US (USGS NWIS).
// Implémente plus tard les appels officiels puis mappe vers {discharge_cms, gauge_height_m, water_temp_c}.
const fetch = require('node-fetch');

async function fetchDailyHydro(river) {
  // river: {slug, bbox or canonical gauge id in future}
  
  try {
    // TODO: Implémenter les vrais appels API
    // Canada: https://api.weather.gc.ca/collections/hydrometric-daily-mean/items
    // US: https://waterservices.usgs.gov/nwis/dv/
    
    // Placeholder avec données simulées pour test
    const mockData = {
      discharge_cms: Math.random() * 100 + 20,   // ex: 45.2
      gauge_height_m: Math.random() * 2 + 0.5,   // ex: 1.23
      water_temp_c: Math.random() * 15 + 5,      // ex: 12.5
      source: 'hydro-placeholder',
      gauge_id: `mock-${river.slug}`,
      fetched_at: new Date().toISOString()
    };
    
    return mockData;
  } catch (error) {
    console.error('Hydro fetch error:', error.message);
    return {
      discharge_cms: null,
      gauge_height_m: null,
      water_temp_c: null,
      source: 'hydro-error',
      gauge_id: null,
      error: error.message
    };
  }
}

// Pour l'historique précis
async function fetchHistoricalHydro(river, timestamp) {
  try {
    // TODO: Implémenter les appels historiques
    return {
      discharge_cms: null,
      gauge_height_m: null,
      water_temp_c: null,
      source: 'hydro-historical-placeholder',
      gauge_id: null,
      timestamp: timestamp
    };
  } catch (error) {
    console.error('Historical hydro fetch error:', error.message);
    return null;
  }
}

module.exports = { fetchDailyHydro, fetchHistoricalHydro };



