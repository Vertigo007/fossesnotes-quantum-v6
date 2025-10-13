// OpenWeather OneCall (historique/jour J). Nécessite OPENWEATHER_API_KEY.
// NOTE: pour l'historique précis (timestamp passé), One Call "timemachine" peut être requis (selon offre).
const fetch = require('node-fetch');
const API_KEY = process.env.OPENWEATHER_API_KEY;

async function fetchDailySummary(lat, lon, dateISO) {
  if (!API_KEY) return null;
  
  try {
    // Simplifié: on récupère la météo actuelle et/ou daily; pour "snapshot quotidien", on l'exécute chaque jour.
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    
    // Résumé minimal
    const d0 = (j.daily && j.daily[0]) || {};
    return {
      temp_min: d0.temp?.min ?? j.current?.temp,
      temp_max: d0.temp?.max ?? j.current?.temp,
      wind_speed: j.current?.wind_speed,
      wind_gust: j.current?.wind_gust,
      precip_mm: (d0.rain || d0.snow) ?? 0,
      clouds: d0.clouds ?? j.current?.clouds,
      summary_fr: d0.weather?.[0]?.description || j.current?.weather?.[0]?.description || null,
      source: 'openweather',
      fetched_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Weather fetch error:', error.message);
    return null;
  }
}

// Pour l'historique précis (si disponible)
async function fetchHistoricalWeather(lat, lon, timestamp) {
  if (!API_KEY) return null;
  
  try {
    const url = `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${timestamp}&units=metric&lang=fr&appid=${API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    
    const current = j.data?.[0]?.current;
    if (!current) return null;
    
    return {
      temp: current.temp,
      wind_speed: current.wind_speed,
      wind_gust: current.wind_gust,
      precip_mm: current.rain?.['1h'] || 0,
      clouds: current.clouds,
      summary_fr: current.weather?.[0]?.description || null,
      source: 'openweather_historical',
      fetched_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Historical weather fetch error:', error.message);
    return null;
  }
}

module.exports = { fetchDailySummary, fetchHistoricalWeather };



