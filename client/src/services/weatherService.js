// Service météo utilisant Open-Meteo (100% gratuit, sans clé API)
// FossesNotes QUANTUM v6.0

import { getWeatherData, getFishingConditions } from '../config/mapConfig';

class WeatherService {
  constructor() {
    this.baseUrl = 'https://api.open-meteo.com/v1';
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
  }

  // Obtenir les conditions météo actuelles
  async getCurrentWeather(latitude, longitude) {
    const cacheKey = `current_${latitude}_${longitude}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const weatherData = await getWeatherData(latitude, longitude);
      
      if (weatherData.success) {
        const fishingConditions = getFishingConditions(weatherData.data);
        const result = {
          ...weatherData.data,
          fishingConditions
        };
        
        this.setCachedData(cacheKey, result);
        return result;
      } else {
        throw new Error(weatherData.error);
      }
    } catch (error) {
      console.error('Erreur météo:', error);
      throw error;
    }
  }

  // Obtenir les prévisions horaires
  async getHourlyForecast(latitude, longitude, days = 7) {
    const cacheKey = `hourly_${latitude}_${longitude}_${days}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/forecast`;
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,pressure_msl,weather_code',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
        timezone: 'auto',
        forecast_days: days.toString()
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (response.ok) {
        const result = {
          hourly: data.hourly,
          daily: data.daily,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.timezone
          }
        };

        this.setCachedData(cacheKey, result);
        return result;
      } else {
        throw new Error(`Erreur API: ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur prévisions:', error);
      throw error;
    }
  }

  // Obtenir les conditions météo marines (pour pêche en mer)
  async getMarineWeather(latitude, longitude) {
    const cacheKey = `marine_${latitude}_${longitude}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/marine`;
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        hourly: 'wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction',
        timezone: 'auto'
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (response.ok) {
        const result = {
          marine: data.hourly,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.timezone
          }
        };

        this.setCachedData(cacheKey, result);
        return result;
      } else {
        throw new Error(`Erreur API marine: ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur météo marine:', error);
      throw error;
    }
  }

  // Obtenir les conditions optimales pour la pêche
  async getOptimalFishingConditions(latitude, longitude) {
    try {
      const weatherData = await this.getCurrentWeather(latitude, longitude);
      const hourlyData = await this.getHourlyForecast(latitude, longitude, 3);
      
      // Analyser les 72 prochaines heures pour trouver les meilleures fenêtres
      const optimalWindows = this.analyzeOptimalWindows(hourlyData.hourly);
      
      return {
        current: weatherData.fishingConditions,
        optimalWindows,
        recommendations: this.generateRecommendations(weatherData.fishingConditions, optimalWindows)
      };
    } catch (error) {
      console.error('Erreur conditions optimales:', error);
      throw error;
    }
  }

  // Analyser les fenêtres optimales de pêche
  analyzeOptimalWindows(hourlyData) {
    const windows = [];
    const hours = hourlyData.time;
    const temperatures = hourlyData.temperature_2m;
    const windSpeeds = hourlyData.wind_speed_10m;
    const pressures = hourlyData.pressure_msl;
    const precipitations = hourlyData.precipitation_probability;

    for (let i = 0; i < hours.length; i++) {
      const temp = temperatures[i];
      const wind = windSpeeds[i];
      const pressure = pressures[i];
      const precip = precipitations[i];

      // Calculer le score pour cette heure
      let score = 50;
      
      // Température (idéal: 15-20°C)
      if (temp >= 15 && temp <= 20) score += 20;
      else if (temp >= 10 && temp <= 25) score += 10;
      
      // Vent (idéal: < 15 km/h)
      if (wind < 15) score += 20;
      else if (wind < 25) score += 10;
      
      // Pression (idéal: 1010-1020 hPa)
      if (pressure >= 1010 && pressure <= 1020) score += 10;
      
      // Précipitations (idéal: < 30%)
      if (precip < 30) score += 10;

      // Si score > 80, c'est une fenêtre optimale
      if (score >= 80) {
        windows.push({
          time: hours[i],
          score,
          conditions: {
            temperature: temp,
            windSpeed: wind,
            pressure,
            precipitation: precip
          }
        });
      }
    }

    // Trier par score décroissant et limiter à 5 fenêtres
    return windows
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  // Générer des recommandations personnalisées
  generateRecommendations(currentConditions, optimalWindows) {
    const recommendations = [];

    if (currentConditions.score >= 80) {
      recommendations.push({
        type: 'excellent',
        message: 'Conditions excellentes pour la pêche ! Sortez maintenant.',
        priority: 'high'
      });
    } else if (currentConditions.score >= 60) {
      recommendations.push({
        type: 'good',
        message: 'Conditions bonnes. Idéal pour une sortie de pêche.',
        priority: 'medium'
      });
    } else {
      recommendations.push({
        type: 'poor',
        message: 'Conditions difficiles. Attendez une meilleure fenêtre.',
        priority: 'low'
      });
    }

    if (optimalWindows.length > 0) {
      const nextWindow = optimalWindows[0];
      const nextTime = new Date(nextWindow.time);
      const now = new Date();
      const hoursUntil = Math.round((nextTime - now) / (1000 * 60 * 60));

      if (hoursUntil <= 6) {
        recommendations.push({
          type: 'timing',
          message: `Meilleure fenêtre dans ${hoursUntil} heure(s).`,
          priority: 'medium'
        });
      }
    }

    // Recommandations spécifiques selon les conditions
    const { factors } = currentConditions;
    factors.forEach(factor => {
      if (factor.score < 40) {
        recommendations.push({
          type: 'warning',
          message: `${factor.name} défavorable: ${factor.value}`,
          priority: 'low'
        });
      }
    });

    return recommendations;
  }

  // Gestion du cache
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Vider le cache
  clearCache() {
    this.cache.clear();
  }

  // Obtenir les statistiques du cache
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instance singleton
const weatherService = new WeatherService();

export default weatherService;






