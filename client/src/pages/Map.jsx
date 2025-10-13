import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useMap } from '../context/MapContext';
import InteractiveMap from '../components/InteractiveMap';
import { MapPin, Filter, Search, Layers, Fullscreen, Maximize2, Navigation } from 'lucide-react';

const Map = () => {
  const { language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { rivers, loading, error, getCurrentLocation } = useMap();
  
  const [mapSize, setMapSize] = useState('normal');
  const [showLegend, setShowLegend] = useState(true);
  const [showRiverList, setShowRiverList] = useState(false);
  const [filters, setFilters] = useState({
    province: '',
    region: '',
    type: '',
    class: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Géolocalisation automatique si l'utilisateur est connecté
  useEffect(() => {
    if (isAuthenticated) {
      getCurrentLocation().catch(console.error);
    }
  }, [isAuthenticated, getCurrentLocation]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleMapSize = () => {
    setMapSize(prev => prev === 'normal' ? 'fullscreen' : 'normal');
  };

  const toggleLegend = () => {
    setShowLegend(prev => !prev);
  };

  const toggleRiverList = () => {
    setShowRiverList(prev => !prev);
  };

  const filteredRivers = (rivers || []).filter(river => {
    // Filtre par recherche
    if (searchTerm && !river.nom.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtres par province, région, type, classe
    if (filters.province && river.province !== filters.province) return false;
    if (filters.region && river.region !== filters.region) return false;
    if (filters.type && river.type_riviere !== filters.type) return false;
    if (filters.class && river.classe_riviere !== filters.class) return false;
    
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' ? 'Chargement de la carte...' : 'Loading map...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {language === 'fr' ? 'Erreur de chargement' : 'Loading Error'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {language === 'fr' ? 'Réessayer' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${mapSize === 'fullscreen' ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header avec contrôles */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {language === 'fr' ? 'Carte Interactive' : 'Interactive Map'}
              </h1>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredRivers.length} {language === 'fr' ? 'rivières' : 'rivers'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={language === 'fr' ? 'Rechercher une rivière...' : 'Search rivers...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              {/* Boutons de contrôle */}
              <button
                onClick={toggleLegend}
                className={`p-2 rounded-lg transition-colors ${
                  showLegend 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
                title={language === 'fr' ? 'Afficher/Masquer la légende' : 'Show/Hide legend'}
              >
                <Layers className="w-5 h-5" />
              </button>
              
              <button
                onClick={toggleRiverList}
                className={`p-2 rounded-lg transition-colors ${
                  showRiverList 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
                title={language === 'fr' ? 'Liste des rivières' : 'River list'}
              >
                <Filter className="w-5 h-5" />
              </button>
              
              <button
                onClick={toggleMapSize}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={language === 'fr' ? 'Plein écran' : 'Fullscreen'}
              >
                {mapSize === 'fullscreen' ? <Maximize2 className="w-5 h-5" /> : <Fullscreen className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Carte interactive */}
        <div className="flex-1 relative">
          <InteractiveMap />
        </div>
      </div>
    </div>
  );
};

export default Map;

