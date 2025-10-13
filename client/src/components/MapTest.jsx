import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mapLayers } from '../config/mapConfig';
import { Layers, MapPin, Navigation } from 'lucide-react';

const MapTest = () => {
  const { language } = useLanguage();
  const [selectedLayer, setSelectedLayer] = useState('routiere');

  const handleLayerChange = (layerKey) => {
    setSelectedLayer(layerKey);
  };

  const getLayerInfo = (layerKey) => {
    const layer = mapLayers[layerKey];
    return {
      name: layer.name,
      url: layer.url,
      attribution: layer.attribution,
      maxZoom: layer.maxZoom || 19
    };
  };

  const currentLayer = getLayerInfo(selectedLayer);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'fr' ? 'Test des Cartes Open Source' : 'Open Source Maps Test'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' 
              ? 'Test des nouvelles sources de cartes 100% gratuites'
              : 'Testing new 100% free map sources'
            }
          </p>
        </div>

        {/* Map Layer Selector */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              {language === 'fr' ? 'Sélectionner une carte' : 'Select Map Layer'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(mapLayers).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => handleLayerChange(key)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedLayer === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{layer.name.split(' ')[0]}</div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {layer.name.split(' ').slice(1).join(' ')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Zoom: {layer.maxZoom || 19}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="h-96 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 relative">
            {/* Map Placeholder with Layer Info */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {currentLayer.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {language === 'fr' 
                    ? 'Carte interactive avec coordonnées GPS précises'
                    : 'Interactive map with precise GPS coordinates'
                  }
                </p>
                
                {/* Layer Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {language === 'fr' ? 'Détails de la couche' : 'Layer Details'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {language === 'fr' ? 'URL' : 'URL'}:
                      </span>
                      <span className="text-gray-900 dark:text-white font-mono text-xs">
                        {currentLayer.url.split('/')[2]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {language === 'fr' ? 'Zoom max' : 'Max Zoom'}:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {currentLayer.maxZoom}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {language === 'fr' ? 'Attribution' : 'Attribution'}:
                      </span>
                      <span className="text-gray-900 dark:text-white text-xs">
                        {currentLayer.attribution}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
              <div className="space-y-2">
                <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  {language === 'fr' ? 'Ma position' : 'My Location'}
                </button>
                <button className="w-full px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                  {language === 'fr' ? 'Zoom +' : 'Zoom +'}
                </button>
                <button className="w-full px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                  {language === 'fr' ? 'Zoom -' : 'Zoom -'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Layer Information */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language === 'fr' ? 'Informations sur les sources' : 'Source Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(mapLayers).map(([key, layer]) => (
                <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{layer.name.split(' ')[0]}</span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {layer.name.split(' ').slice(1).join(' ')}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {layer.attribution}
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        {language === 'fr' ? 'Zoom max' : 'Max Zoom'}:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {layer.maxZoom || 19}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        {language === 'fr' ? 'Sous-domaines' : 'Subdomains'}:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {layer.subdomains?.join(', ') || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              {language === 'fr' ? 'Avantages Open Source' : 'Open Source Benefits'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'fr' ? '100% Gratuit' : '100% Free'}
                </h3>
                <p className="text-green-100">
                  {language === 'fr' 
                    ? 'Aucun coût d\'API ou d\'abonnement'
                    : 'No API costs or subscriptions'
                  }
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🔓</div>
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'fr' ? 'Indépendant' : 'Independent'}
                </h3>
                <p className="text-green-100">
                  {language === 'fr' 
                    ? 'Pas de dépendance aux services payants'
                    : 'No dependency on paid services'
                  }
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'fr' ? 'Communautaire' : 'Community'}
                </h3>
                <p className="text-green-100">
                  {language === 'fr' 
                    ? 'Soutenu par la communauté open source'
                    : 'Supported by open source community'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapTest;






