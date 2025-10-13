import React, { useState, useEffect } from 'react';
import { Cloud, Sun, Wind, Thermometer, Droplets, Gauge } from 'lucide-react';
import weatherService from '../services/weatherService';
import { useLanguage } from '../context/LanguageContext';

const WeatherWidget = ({ latitude, longitude, className = '' }) => {
  const { language } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (latitude && longitude) {
      loadWeather();
    }
  }, [latitude, longitude]);

  const loadWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const weatherData = await weatherService.getCurrentWeather(latitude, longitude);
      setWeather(weatherData);
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement météo:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weatherCode) => {
    // Codes météo Open-Meteo
    if (weatherCode >= 0 && weatherCode <= 3) return <Sun className="w-6 h-6 text-yellow-500" />;
    if (weatherCode >= 45 && weatherCode <= 48) return <Cloud className="w-6 h-6 text-gray-400" />;
    if (weatherCode >= 51 && weatherCode <= 67) return <Droplets className="w-6 h-6 text-blue-400" />;
    if (weatherCode >= 71 && weatherCode <= 77) return <Cloud className="w-6 h-6 text-gray-300" />;
    if (weatherCode >= 80 && weatherCode <= 82) return <Droplets className="w-6 h-6 text-blue-500" />;
    if (weatherCode >= 85 && weatherCode <= 86) return <Cloud className="w-6 h-6 text-gray-200" />;
    if (weatherCode >= 95 && weatherCode <= 99) return <Cloud className="w-6 h-6 text-gray-600" />;
    return <Sun className="w-6 h-6 text-yellow-500" />;
  };

  const getFishingScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-red-600">
          <Cloud className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">
            {language === 'fr' ? 'Erreur météo' : 'Weather error'}
          </p>
          <button 
            onClick={loadWeather}
            className="text-xs text-blue-600 hover:underline mt-2"
          >
            {language === 'fr' ? 'Réessayer' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const { current, fishingConditions } = weather;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {language === 'fr' ? 'Conditions Météo' : 'Weather Conditions'}
        </h3>
        <div className="flex items-center gap-2">
          {getWeatherIcon(current.weathercode)}
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(current.temperature)}°C
          </span>
        </div>
      </div>

      {/* Score de pêche */}
      {fishingConditions && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'fr' ? 'Score de pêche' : 'Fishing Score'}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getFishingScoreColor(fishingConditions.score)}`}>
              {fishingConditions.score}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                fishingConditions.score >= 80 ? 'bg-green-500' :
                fishingConditions.score >= 60 ? 'bg-blue-500' :
                fishingConditions.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${fishingConditions.score}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {fishingConditions.recommendation}
          </p>
        </div>
      )}

      {/* Détails météo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'fr' ? 'Vent' : 'Wind'}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.round(current.windspeed)} km/h
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'fr' ? 'Humidité' : 'Humidity'}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.round(current.relative_humidity_2m)}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'fr' ? 'Pression' : 'Pressure'}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.round(current.pressure_msl)} hPa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'fr' ? 'Ressenti' : 'Feels like'}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.round(current.apparent_temperature)}°C
            </p>
          </div>
        </div>
      </div>

      {/* Facteurs de pêche */}
      {fishingConditions && fishingConditions.factors && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {language === 'fr' ? 'Facteurs de pêche' : 'Fishing Factors'}
          </h4>
          <div className="space-y-2">
            {fishingConditions.factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {factor.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {factor.value}
                  </span>
                  <span className={`px-1 py-0.5 rounded text-xs ${
                    factor.score >= 70 ? 'bg-green-100 text-green-800' :
                    factor.score >= 50 ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {factor.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source */}
      <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Powered by Open-Meteo (Open Source)
        </p>
      </div>
    </div>
  );
};

export default WeatherWidget;






