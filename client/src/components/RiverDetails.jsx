import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  Calendar, 
  Fish, 
  Info, 
  Lock, 
  ExternalLink,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const RiverDetails = ({ river, onClose }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Déterminer le plan de l'utilisateur
  const userPlan = user?.plan || 'free';

  // Charger les données météo pour les plans premium
  useEffect(() => {
    if (userPlan !== 'free' && river) {
      fetchWeatherData();
    }
  }, [river, userPlan]);

  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/weather/river/${river.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWeatherData(data.weather);
      }
    } catch (error) {
      console.error('Erreur chargement météo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Informations de base (tous les plans)
  const getBasicInfo = () => (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Info className="w-4 h-4" />
        {language === 'fr' ? 'Informations de base' : 'Basic Information'}
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Province' : 'Province'}:</span>
          <span className="font-medium">{river.province}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Région' : 'Region'}:</span>
          <span className="font-medium">{river.region}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Type' : 'Type'}:</span>
          <span className="font-medium">{river.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Longueur' : 'Length'}:</span>
          <span className="font-medium">{river.longueur_km} km</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Nombre de fosses' : 'Number of pools'}:</span>
          <span className="font-medium">{river.nombre_fosses}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Classe' : 'Class'}:</span>
          <span className="font-medium">{river.classe}</span>
        </div>
      </div>
    </div>
  );

  // Informations GPS et navigation (tous les plans)
  const getGPSInfo = () => (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {language === 'fr' ? 'Localisation' : 'Location'}
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Latitude' : 'Latitude'}:</span>
          <span className="font-medium">{river.latitude}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Longitude' : 'Longitude'}:</span>
          <span className="font-medium">{river.longitude}</span>
        </div>
        <button
          onClick={() => {
            const url = `https://www.google.com/maps?q=${river.latitude},${river.longitude}`;
            window.open(url, '_blank');
          }}
          className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          {language === 'fr' ? 'Ouvrir dans Google Maps' : 'Open in Google Maps'}
        </button>
      </div>
    </div>
  );

  // Informations de pêche actuelles (tous les plans)
  const getFishingInfo = () => (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Fish className="w-4 h-4" />
        {language === 'fr' ? 'Conditions de pêche' : 'Fishing Conditions'}
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Statut' : 'Status'}:</span>
          <span className={`font-medium ${river.statut_conditions === 'Excellente' ? 'text-green-600' : 'text-yellow-600'}`}>
            {river.statut_conditions || (language === 'fr' ? 'Non disponible' : 'Not available')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Saison' : 'Season'}:</span>
          <span className="font-medium">{river.saison_peche || (language === 'fr' ? 'Toute l\'année' : 'All year')}</span>
        </div>
      </div>
    </div>
  );

  // Informations de tirage au sort (tous les plans)
  const getLotteryInfo = () => (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        {language === 'fr' ? 'Tirage au sort' : 'Lottery'}
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Statut' : 'Status'}:</span>
          <span className="font-medium text-green-600">
            {language === 'fr' ? 'Ouvert' : 'Open'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{language === 'fr' ? 'Date limite' : 'Deadline'}:</span>
          <span className="font-medium">15 Mars 2025</span>
        </div>
        <button
          onClick={() => {
            const url = `https://www.quebec.ca/agriculture-environnement-et-ressources-naturelles/faune/peche-sportive/tirage-au-sort`;
            window.open(url, '_blank');
          }}
          className="w-full bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          {language === 'fr' ? 'S\'inscrire au tirage' : 'Register for lottery'}
        </button>
      </div>
    </div>
  );

  // Informations météo avancées (Standard et plus)
  const getWeatherInfo = () => {
    if (userPlan === 'free') {
      return (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Wind className="w-4 h-4" />
            {language === 'fr' ? 'Météo avancée' : 'Advanced Weather'}
          </h3>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'fr' 
                ? 'Météo 7 jours et prévisions détaillées disponibles avec le plan Standard'
                : '7-day weather and detailed forecasts available with Standard plan'
              }
            </p>
            <button
              onClick={() => window.location.href = '/register'}
              className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {language === 'fr' ? 'Passer au Standard' : 'Upgrade to Standard'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Wind className="w-4 h-4" />
          {language === 'fr' ? 'Météo 7 jours' : '7-Day Weather'}
        </h3>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : weatherData ? (
          <div className="space-y-2 text-sm">
            {weatherData.forecast?.slice(0, 7).map((day, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="font-medium">{day.date}</span>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <span>{day.temp}°C</span>
                  <Wind className="w-4 h-4 text-blue-500" />
                  <span>{day.wind} km/h</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'fr' ? 'Données météo non disponibles' : 'Weather data not available'}
          </p>
        )}
      </div>
    );
  };

  // Informations sur les mouches (Standard et plus)
  const getFliesInfo = () => {
    if (userPlan === 'free') {
      return (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Fish className="w-4 h-4" />
            {language === 'fr' ? 'Mouches recommandées' : 'Recommended Flies'}
          </h3>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'fr' 
                ? 'Mouches reconnues et techniques disponibles avec le plan Standard'
                : 'Recognized flies and techniques available with Standard plan'
              }
            </p>
            <button
              onClick={() => window.location.href = '/register'}
              className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {language === 'fr' ? 'Passer au Standard' : 'Upgrade to Standard'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Fish className="w-4 h-4" />
          {language === 'fr' ? 'Mouches recommandées' : 'Recommended Flies'}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="font-medium mb-1">{language === 'fr' ? 'Mouches sèches' : 'Dry Flies'}</div>
            <div className="text-gray-600 dark:text-gray-400">Adams, Royal Wulff, Elk Hair Caddis</div>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="font-medium mb-1">{language === 'fr' ? 'Nymphes' : 'Nymphs'}</div>
            <div className="text-gray-600 dark:text-gray-400">Pheasant Tail, Hare's Ear, Prince Nymph</div>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="font-medium mb-1">{language === 'fr' ? 'Streamers' : 'Streamers'}</div>
            <div className="text-gray-600 dark:text-gray-400">Woolly Bugger, Muddler Minnow</div>
          </div>
        </div>
      </div>
    );
  };

  // Informations sur l'eau (Premium et plus)
  const getWaterInfo = () => {
    if (userPlan === 'free' || userPlan === 'standard') {
      return (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            {language === 'fr' ? 'Conditions de l\'eau' : 'Water Conditions'}
          </h3>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'fr' 
                ? 'Température, niveau et débit disponibles avec le plan Premium'
                : 'Temperature, level and flow available with Premium plan'
              }
            </p>
            <button
              onClick={() => window.location.href = '/register'}
              className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {language === 'fr' ? 'Passer au Premium' : 'Upgrade to Premium'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Droplets className="w-4 h-4" />
          {language === 'fr' ? 'Conditions de l\'eau' : 'Water Conditions'}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{language === 'fr' ? 'Température' : 'Temperature'}:</span>
            <span className="font-medium flex items-center gap-1">
              <Thermometer className="w-4 h-4 text-blue-500" />
              {river.temperature_eau || '12'}°C
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{language === 'fr' ? 'Niveau' : 'Level'}:</span>
            <span className="font-medium">{river.niveau_eau || 'Normal'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{language === 'fr' ? 'Débit' : 'Flow'}:</span>
            <span className="font-medium">{river.debit || '45'} m³/s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{language === 'fr' ? 'Clarté' : 'Clarity'}:</span>
            <span className="font-medium">{river.clarte || 'Excellente'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Prédictions IA (Elite et plus)
  const getAIPredictions = () => {
    if (userPlan !== 'premium' && userPlan !== 'pro') {
      return (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {language === 'fr' ? 'Prédictions IA' : 'AI Predictions'}
          </h3>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'fr' 
                ? 'Algorithme propriétaire de prédiction disponible avec le plan Premium'
                : 'Proprietary prediction algorithm available with Premium plan'
              }
            </p>
            <button
              onClick={() => window.location.href = '/register'}
              className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {language === 'fr' ? 'Passer au Premium' : 'Upgrade to Premium'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="w-4 h-4" />
          {language === 'fr' ? 'Prédictions IA' : 'AI Predictions'}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <div className="font-medium text-green-800 dark:text-green-200 mb-1">
              {language === 'fr' ? 'Meilleur moment aujourd\'hui' : 'Best time today'}
            </div>
            <div className="text-green-700 dark:text-green-300">06:00 - 09:00</div>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              {language === 'fr' ? 'Conditions optimales' : 'Optimal conditions'}
            </div>
            <div className="text-blue-700 dark:text-blue-300">
              {language === 'fr' ? 'Température 10-15°C, vent < 15 km/h' : 'Temperature 10-15°C, wind < 15 km/h'}
            </div>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
            <div className="font-medium text-purple-800 dark:text-purple-200 mb-1">
              {language === 'fr' ? 'Probabilité de succès' : 'Success probability'}
            </div>
            <div className="text-purple-700 dark:text-purple-300">85% - {language === 'fr' ? 'Très favorable' : 'Very favorable'}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {river.nom}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' ? 'Plan actuel' : 'Current plan'}: {userPlan.toUpperCase()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Informations de base - Tous les plans */}
        {getBasicInfo()}
        
        {/* GPS et navigation - Tous les plans */}
        {getGPSInfo()}
        
        {/* Conditions de pêche - Tous les plans */}
        {getFishingInfo()}
        
        {/* Tirage au sort - Tous les plans */}
        {getLotteryInfo()}
        
        {/* Météo avancée - Standard et plus */}
        {getWeatherInfo()}
        
        {/* Mouches recommandées - Standard et plus */}
        {getFliesInfo()}
        
        {/* Conditions de l'eau - Premium et plus */}
        {getWaterInfo()}
        
        {/* Prédictions IA - Premium et plus */}
        {getAIPredictions()}
      </div>
    </div>
  );
};

export default RiverDetails;



