// Configuration des sources de cartes et météo open source
// FossesNotes QUANTUM v6.0

// ================================
// CARTES OPEN SOURCE
// ================================

export const mapLayers = {
  // 1. OpenStreetMap (Déjà utilisé - Open Source)
  routiere: {
    name: "🗺️ Routière",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },

  // 2. OpenTopoMap (Remplace Esri Terrain)
  topographique: {
    name: "🏔️ Topographique",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "© OpenTopoMap contributors",
    maxZoom: 17,
    subdomains: ['a', 'b', 'c']
  },

  // 3. CartoDB Positron (Remplace Thunderforest)
  exterieur: {
    name: "🥾 Extérieur",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "© CartoDB",
    maxZoom: 19,
    subdomains: ['a', 'b', 'c', 'd']
  },

  // 4. Stamen Terrain (Alternative satellite)
  satellite: {
    name: "🛰️ Satellite",
    url: "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png",
    attribution: "© Stamen Design",
    maxZoom: 18,
    subdomains: ['a', 'b', 'c', 'd']
  },

  // 5. OpenStreetMap Carto (Style moderne)
  moderne: {
    name: "🎨 Moderne",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors, © CartoDB",
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },

  // 6. CyclOSM (Spécialisé vélo/pêche)
  cyclosm: {
    name: "🚴 CyclOSM",
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors, © CyclOSM",
    maxZoom: 20,
    subdomains: ['a', 'b', 'c']
  }
};

// ================================
// MÉTÉO OPEN SOURCE
// ================================

// Option 1: Open-Meteo (RECOMMANDÉ - 100% gratuit, sans clé API)
export const openMeteoConfig = {
  name: "Open-Meteo",
  baseUrl: "https://api.open-meteo.com/v1",
  endpoints: {
    current: "/forecast",
    hourly: "/forecast", 
    daily: "/forecast",
    marine: "/marine"
  },
  features: {
    currentWeather: true,
    hourlyForecast: true,
    dailyForecast: true,
    marineWeather: true,
    airQuality: true,
    uvIndex: true,
    precipitation: true,
    windSpeed: true,
    pressure: true,
    humidity: true
  },
  limits: {
    requestsPerMinute: 10,
    requestsPerDay: 10000,
    requiresApiKey: false
  }
};

// Option 2: OpenWeatherMap (Gratuit avec limite)
export const openWeatherConfig = {
  name: "OpenWeatherMap",
  baseUrl: "https://api.openweathermap.org/data/2.5",
  apiKey: process.env.REACT_APP_OPENWEATHER_API_KEY,
  endpoints: {
    current: "/weather",
    forecast: "/forecast",
    onecall: "/onecall"
  },
  features: {
    currentWeather: true,
    hourlyForecast: true,
    dailyForecast: true,
    airQuality: true,
    uvIndex: true,
    precipitation: true,
    windSpeed: true,
    pressure: true,
    humidity: true
  },
  limits: {
    requestsPerMinute: 60,
    requestsPerDay: 1000,
    requiresApiKey: true
  }
};

// ================================
// FONCTIONS UTILITAIRES
// ================================

// Fonction pour obtenir les données météo via Open-Meteo
export const getWeatherData = async (latitude, longitude) => {
  try {
    const url = `${openMeteoConfig.baseUrl}${openMeteoConfig.endpoints.current}`;
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current_weather: 'true',
      hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,pressure_msl',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
      timezone: 'auto'
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    return {
      success: true,
      data: {
        current: data.current_weather,
        hourly: data.hourly,
        daily: data.daily,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone
        }
      }
    };
  } catch (error) {
    console.error('Erreur Open-Meteo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Fonction pour obtenir les conditions de pêche optimales
export const getFishingConditions = (weatherData) => {
  if (!weatherData || !weatherData.current) {
    return null;
  }

  const { current, hourly } = weatherData;
  
  // Algorithme de conditions de pêche
  let score = 50; // Score de base
  let factors = [];

  // Facteur température (idéal: 15-20°C)
  const temp = current.temperature;
  const tempScore = temp >= 15 && temp <= 20 ? 90 : 
                   temp >= 10 && temp <= 25 ? 70 : 
                   temp >= 5 && temp <= 30 ? 50 : 30;
  score += (tempScore - 50) * 0.3;
  factors.push({
    name: 'Température',
    score: tempScore,
    value: `${temp}°C`,
    impact: tempScore > 70 ? 'Excellent' : tempScore > 50 ? 'Bon' : 'Moyen'
  });

  // Facteur pression (idéal: 1010-1020 hPa)
  const pressure = current.pressure_msl;
  const pressureScore = pressure >= 1010 && pressure <= 1020 ? 85 :
                       pressure >= 1000 && pressure <= 1030 ? 70 : 50;
  score += (pressureScore - 50) * 0.25;
  factors.push({
    name: 'Pression',
    score: pressureScore,
    value: `${pressure} hPa`,
    impact: pressureScore > 70 ? 'Favorable' : 'Moyen'
  });

  // Facteur vent (idéal: < 15 km/h)
  const windSpeed = current.wind_speed_10m;
  const windScore = windSpeed < 15 ? 90 : 
                   windSpeed < 25 ? 70 : 
                   windSpeed < 35 ? 50 : 30;
  score += (windScore - 50) * 0.25;
  factors.push({
    name: 'Vent',
    score: windScore,
    value: `${windSpeed} km/h`,
    impact: windScore > 70 ? 'Calme' : windScore > 50 ? 'Modéré' : 'Fort'
  });

  // Facteur humidité (idéal: 60-80%)
  const humidity = current.relative_humidity_2m;
  const humidityScore = humidity >= 60 && humidity <= 80 ? 80 :
                       humidity >= 50 && humidity <= 90 ? 60 : 40;
  score += (humidityScore - 50) * 0.2;
  factors.push({
    name: 'Humidité',
    score: humidityScore,
    value: `${humidity}%`,
    impact: humidityScore > 70 ? 'Optimal' : 'Acceptable'
  });

  // Limiter le score entre 0 et 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    factors,
    recommendation: score > 80 ? 'Conditions excellentes' :
                   score > 60 ? 'Conditions bonnes' :
                   score > 40 ? 'Conditions moyennes' : 'Conditions difficiles',
    timestamp: new Date().toISOString()
  };
};

// Configuration par défaut
export const defaultConfig = {
  mapLayer: 'routiere',
  weatherProvider: 'openMeteo',
  language: 'fr'
};

export default {
  mapLayers,
  openMeteoConfig,
  openWeatherConfig,
  getWeatherData,
  getFishingConditions,
  defaultConfig
};






