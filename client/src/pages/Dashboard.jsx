import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { 
  Fish, 
  Calendar, 
  Award, 
  TrendingUp, 
  MapPin, 
  Clock,
  Users,
  Target
} from 'lucide-react';
import WeatherWidget from '../components/WeatherWidget';
import AIAdvisor from '../components/AIAdvisor';

const Dashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const { theme } = useApp();
  const [riverData, setRiverData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  // Coordonnées de test pour le widget météo (Montréal)
  const testCoordinates = {
    latitude: 45.5017,
    longitude: -73.5673
  };

  // Charger les données de rivière et météo pour l'IA conseil
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger une rivière par défaut (Miramichi)
        const riverResponse = await fetch('/api/rivieres/1');
        const riverData = await riverResponse.json();
        if (riverData.success) {
          setRiverData(riverData.riviere);
        }

        // Charger les données météo
        const weatherResponse = await fetch(`/api/weather?lat=${testCoordinates.latitude}&lon=${testCoordinates.longitude}`);
        const weatherData = await weatherResponse.json();
        if (weatherData.success) {
          setWeatherData(weatherData);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const statsCards = [
    {
      title: language === 'fr' ? 'Captures Total' : 'Total Catches',
      value: '342',
      change: '+12%',
      icon: <Fish className="w-6 h-6 text-blue-600" />,
      color: 'text-blue-600'
    },
    {
      title: language === 'fr' ? 'Rivières Visitées' : 'Rivers Visited',
      value: '18',
      change: '+2',
      icon: <MapPin className="w-6 h-6 text-green-600" />,
      color: 'text-green-600'
    },
    {
      title: language === 'fr' ? 'Sorties' : 'Trips',
      value: '89',
      change: '+5',
      icon: <Calendar className="w-6 h-6 text-orange-600" />,
      color: 'text-orange-600'
    },
    {
      title: language === 'fr' ? 'Score Global' : 'Global Score',
      value: '8,847',
      change: '+234',
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      color: 'text-purple-600'
    }
  ];

  const recentActivity = [
    {
      type: 'catch',
      title: language === 'fr' ? 'Saumon atlantique capturé' : 'Atlantic salmon caught',
      location: 'Rivière Miramichi',
      time: language === 'fr' ? 'Il y a 2 heures' : '2 hours ago',
      icon: <Fish className="w-5 h-5 text-green-600" />
    },
    {
      type: 'trip',
      title: language === 'fr' ? 'Nouvelle sortie planifiée' : 'New trip planned',
      location: 'Rivière Restigouche',
      time: language === 'fr' ? 'Il y a 1 jour' : '1 day ago',
      icon: <Calendar className="w-5 h-5 text-blue-600" />
    },
    {
      type: 'achievement',
      title: language === 'fr' ? 'Badge débloqué' : 'Badge unlocked',
      location: language === 'fr' ? 'Pêcheur Expert' : 'Expert Angler',
      time: language === 'fr' ? 'Il y a 3 jours' : '3 days ago',
      icon: <Award className="w-5 h-5 text-yellow-600" />
    }
  ];

  const nextTrip = {
    date: language === 'fr' ? '15 Juillet 2024' : 'July 15, 2024',
    location: 'Rivière Miramichi',
    conditions: language === 'fr' ? 'Excellentes' : 'Excellent',
    participants: 3
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {language === 'fr' ? 'Connexion requise' : 'Login Required'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' 
              ? 'Connectez-vous pour accéder à votre tableau de bord'
              : 'Please login to access your dashboard'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'fr' ? 'Tableau de Bord' : 'Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' 
              ? `Bienvenue, ${user?.nom || 'Pêcheur'} !`
              : `Welcome, ${user?.nom || 'Angler'}!`
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  <p className="text-sm text-green-600">
                    {card.change}
                  </p>
                </div>
                <div className={card.color}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Weather Widget */}
          <div className="lg:col-span-1">
            <WeatherWidget 
              latitude={testCoordinates.latitude}
              longitude={testCoordinates.longitude}
              className="mb-6"
            />
            
            {/* Next Trip */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Prochaine Sortie' : 'Next Trip'}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {nextTrip.date}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {nextTrip.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {language === 'fr' ? 'Conditions' : 'Conditions'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {nextTrip.conditions}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {language === 'fr' ? 'Participants' : 'Participants'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {nextTrip.participants} {language === 'fr' ? 'pêcheurs' : 'anglers'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Activité Récente' : 'Recent Activity'}
              </h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Advisor Section */}
        <div className="mt-8">
          <AIAdvisor 
            riverData={riverData}
            weatherData={weatherData}
            userLevel="intermediate"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 