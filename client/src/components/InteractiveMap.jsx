import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../context/LanguageContext';
import { mapLayers } from '../config/mapConfig';
import { 
  Fish, 
  MapPin, 
  Navigation, 
  Info, 
  Calendar, 
  Thermometer, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Filter,
  X,
  Crown,
  Star,
  Circle,
  ChevronDown,
  ChevronUp,
  Search,
  List,
  Grid3X3,
  Monitor
} from 'lucide-react';
import RiverDetails from './RiverDetails';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Icône personnalisée pour les rivières
const createRiverIcon = (classe) => {
  const colors = {
    1: '#FF6B6B', // Elite - Rouge
    2: '#4ECDC4', // Standard - Turquoise  
    3: '#45B7D1'  // Débutant - Bleu
  };
  
  return L.divIcon({
    className: 'custom-river-marker',
    html: `<div style="
      width: 20px; 
      height: 20px; 
      background: ${colors[classe]}; 
      border: 2px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
      font-weight: bold;
    ">🎣</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Composant pour centrer la carte sur la position utilisateur
const LocationMarker = ({ onLocationFound }) => {
  const map = useMap();
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 8);
          onLocationFound && onLocationFound({ latitude, longitude });
        },
        (error) => {
          console.log('Erreur géolocalisation:', error);
          // Centrer sur le Québec par défaut
          map.setView([46.8139, -71.2080], 6);
        }
      );
    }
  }, [map, onLocationFound]);

  return null;
};

const InteractiveMap = () => {
  const { language } = useLanguage();
  const [rivieres, setRivieres] = useState([]);
  const [selectedRiver, setSelectedRiver] = useState(null);
  const [currentLayer, setCurrentLayer] = useState('routiere');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [mapSize, setMapSize] = useState('medium'); // 'small', 'medium', 'large'
  const [showLegend, setShowLegend] = useState(true);
  const [showRiverList, setShowRiverList] = useState(true);
  const [filters, setFilters] = useState({
    classe: 'all',
    province: 'all',
    pays: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLegend, setExpandedLegend] = useState(false);
  const mapRef = useRef();

  // Charger les données des rivières
  useEffect(() => {
    const fetchRivieres = async () => {
      try {
        const response = await fetch('/api/rivieres');
        const data = await response.json();
        if (data.success) {
          setRivieres(data.rivieres);
        }
      } catch (error) {
        console.error('Erreur chargement rivières:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRivieres();
  }, []);

  // Gérer le changement de couche de carte
  const handleLayerChange = (layerKey) => {
    setCurrentLayer(layerKey);
  };

  // Gérer la sélection d'une rivière
  const handleRiverSelect = (river) => {
    setSelectedRiver(river);
  };

  // Gérer la fermeture des détails
  const handleCloseDetails = () => {
    setSelectedRiver(null);
  };

  // Gérer la taille de la carte
  const handleMapSizeChange = (size) => {
    setMapSize(size);
  };

  // Gérer les filtres
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Filtrer les rivières
  const filteredRivieres = rivieres.filter(river => {
    if (filters.classe !== 'all' && river.classe !== parseInt(filters.classe)) return false;
    if (filters.province !== 'all' && river.province_etat !== filters.province) return false;
    if (filters.pays !== 'all' && river.pays !== filters.pays) return false;
    if (searchTerm && !river.nom.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !river.province_etat.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Obtenir les détails de la rivière
  const getRiverDetails = (river) => {
    const classeNames = {
      1: language === 'fr' ? 'Elite' : 'Elite',
      2: language === 'fr' ? 'Standard' : 'Standard',
      3: language === 'fr' ? 'Débutant' : 'Beginner'
    };

    const classeColors = {
      1: 'text-red-600',
      2: 'text-teal-600',
      3: 'text-blue-600'
    };

    const statusColors = {
      'excellente': 'text-green-600',
      'bonne': 'text-blue-600',
      'moyenne': 'text-yellow-600',
      'difficile': 'text-orange-600',
      'fermee': 'text-red-600'
    };

    return {
      classe: classeNames[river.classe],
      classeColor: classeColors[river.classe],
      statusColor: statusColors[river.statut_conditions] || 'text-gray-600'
    };
  };

  // Obtenir les provinces/états uniques
  const provinces = [...new Set(rivieres.map(r => r.province_etat))];
  const pays = [...new Set(rivieres.map(r => r.pays))];

  // Définir les tailles de carte
  const mapSizes = {
    small: 'h-64',
    medium: 'h-96',
    large: 'h-[600px]'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contrôles de la carte */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Contrôles de gauche */}
          <div className="flex items-center gap-4">
            {/* Sélecteur de taille de carte */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{language === 'fr' ? 'Taille' : 'Size'}:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleMapSizeChange('small')}
                  className={`p-2 rounded ${mapSize === 'small' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                  title={language === 'fr' ? 'Petite' : 'Small'}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMapSizeChange('medium')}
                  className={`p-2 rounded ${mapSize === 'medium' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                  title={language === 'fr' ? 'Moyenne' : 'Medium'}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMapSizeChange('large')}
                  className={`p-2 rounded ${mapSize === 'large' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                  title={language === 'fr' ? 'Grande' : 'Large'}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sélecteur de couche */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <select
                value={currentLayer}
                onChange={(e) => handleLayerChange(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                {Object.entries(mapLayers).map(([key, layer]) => (
                  <option key={key} value={key}>
                    {layer.name[language]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contrôles de droite */}
          <div className="flex items-center gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'fr' ? 'Rechercher une rivière...' : 'Search a river...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Bouton liste des rivières */}
            <button
              onClick={() => setShowRiverList(!showRiverList)}
              className={`p-2 rounded-lg transition-colors ${
                showRiverList ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title={language === 'fr' ? 'Liste des rivières' : 'River list'}
            >
              <List className="w-4 h-4" />
            </button>

            {/* Bouton légende */}
            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`p-2 rounded-lg transition-colors ${
                showLegend ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title={language === 'fr' ? 'Légende' : 'Legend'}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">{language === 'fr' ? 'Filtres' : 'Filters'}:</span>
            <select
              value={filters.classe}
              onChange={(e) => handleFilterChange('classe', e.target.value)}
              className="text-sm border rounded px-3 py-1"
            >
              <option value="all">{language === 'fr' ? 'Toutes les classes' : 'All classes'}</option>
              <option value="1">{language === 'fr' ? 'Elite' : 'Elite'}</option>
              <option value="2">{language === 'fr' ? 'Standard' : 'Standard'}</option>
              <option value="3">{language === 'fr' ? 'Débutant' : 'Beginner'}</option>
            </select>
            <select
              value={filters.province}
              onChange={(e) => handleFilterChange('province', e.target.value)}
              className="text-sm border rounded px-3 py-1"
            >
              <option value="all">{language === 'fr' ? 'Toutes les provinces' : 'All provinces'}</option>
              {provinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
            <select
              value={filters.pays}
              onChange={(e) => handleFilterChange('pays', e.target.value)}
              className="text-sm border rounded px-3 py-1"
            >
              <option value="all">{language === 'fr' ? 'Tous les pays' : 'All countries'}</option>
              {pays.map(pays => (
                <option key={pays} value={pays}>{pays}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Légende */}
      {showLegend && (
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'fr' ? 'Légende des rivières' : 'River Legend'}
            </h3>
            <button
              onClick={() => setExpandedLegend(!expandedLegend)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedLegend ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Classes de rivières */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">{language === 'fr' ? 'Classes de rivières' : 'River Classes'}</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-red-600">{language === 'fr' ? 'Elite' : 'Elite'}</span>
                      <Crown className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-xs text-gray-600">{language === 'fr' ? 'Rivières de classe mondiale' : 'World-class rivers'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-teal-500 rounded-full border-2 border-white shadow-sm"></div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-teal-600">{language === 'fr' ? 'Standard' : 'Standard'}</span>
                      <Star className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-600">{language === 'fr' ? 'Rivières de qualité' : 'Quality rivers'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-blue-600">{language === 'fr' ? 'Débutant' : 'Beginner'}</span>
                      <Circle className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-600">{language === 'fr' ? 'Rivières accessibles' : 'Accessible rivers'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditions de pêche */}
            {expandedLegend && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">{language === 'fr' ? 'Conditions de pêche' : 'Fishing Conditions'}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>{language === 'fr' ? 'Excellente' : 'Excellent'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>{language === 'fr' ? 'Bonne' : 'Good'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>{language === 'fr' ? 'Moyenne' : 'Average'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>{language === 'fr' ? 'Difficile' : 'Difficult'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>{language === 'fr' ? 'Fermée' : 'Closed'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Statistiques */}
            {expandedLegend && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">{language === 'fr' ? 'Statistiques' : 'Statistics'}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">
                      {filteredRivieres.filter(r => r.classe === 1).length}
                    </div>
                    <div className="text-xs text-gray-600">{language === 'fr' ? 'Elite' : 'Elite'}</div>
                  </div>
                  <div className="text-center p-2 bg-teal-50 rounded">
                    <div className="text-lg font-bold text-teal-600">
                      {filteredRivieres.filter(r => r.classe === 2).length}
                    </div>
                    <div className="text-xs text-gray-600">{language === 'fr' ? 'Standard' : 'Standard'}</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {filteredRivieres.filter(r => r.classe === 3).length}
                    </div>
                    <div className="text-xs text-gray-600">{language === 'fr' ? 'Débutant' : 'Beginner'}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-gray-800">
                      {filteredRivieres.length}
                    </div>
                    <div className="text-xs text-gray-600">{language === 'fr' ? 'Total' : 'Total'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Carte */}
      <div className={`${mapSizes[mapSize]} rounded-lg overflow-hidden shadow-lg`}>
        <MapContainer
          center={[46.8139, -71.2080]}
          zoom={6}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            url={mapLayers[currentLayer].url}
            attribution={mapLayers[currentLayer].attribution}
          />
          
          <LocationMarker onLocationFound={setUserLocation} />

          {/* Marqueurs des rivières */}
          {filteredRivieres.map((river) => {
            const details = getRiverDetails(river);
            return (
              <Marker
                key={river.id}
                position={[river.latitude, river.longitude]}
                icon={createRiverIcon(river.classe)}
                eventHandlers={{
                  click: () => handleRiverSelect(river)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[250px]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{river.nom}</h3>
                      <span className={`text-sm font-semibold ${details.classeColor}`}>
                        {details.classe}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'fr' ? 'Province' : 'Province'}:</span>
                        <span className="font-medium">{river.province_etat}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'fr' ? 'Région' : 'Region'}:</span>
                        <span className="font-medium">{river.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'fr' ? 'Type' : 'Type'}:</span>
                        <span className="font-medium">{river.type}</span>
                      </div>
                      {river.nombre_fosses && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{language === 'fr' ? 'Fosses' : 'Pools'}:</span>
                          <span className="font-medium">{river.nombre_fosses}</span>
                        </div>
                      )}
                      {river.temperature_eau && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{language === 'fr' ? 'Temp. eau' : 'Water temp'}:</span>
                          <span className="font-medium">{river.temperature_eau}°C</span>
                        </div>
                      )}
                      {river.statut_conditions && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{language === 'fr' ? 'Conditions' : 'Conditions'}:</span>
                          <span className={`font-medium ${details.statusColor}`}>
                            {river.statut_conditions}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setSelectedRiver(river)}
                        className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        {language === 'fr' ? 'Voir détails' : 'View Details'}
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Panneau de détails de la rivière sélectionnée */}
      {selectedRiver && (
        <div className="mt-4">
          <RiverDetails river={selectedRiver} onClose={handleCloseDetails} />
        </div>
      )}

      {/* Liste des rivières */}
      {showRiverList && (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'fr' ? 'Liste des rivières' : 'River List'} 
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredRivieres.length} {language === 'fr' ? 'rivières' : 'rivers'})
              </span>
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredRivieres.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {language === 'fr' ? 'Aucune rivière trouvée' : 'No rivers found'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredRivieres.map((river) => {
                  const details = getRiverDetails(river);
                  return (
                    <div
                      key={river.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedRiver?.id === river.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleRiverSelect(river)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{river.nom}</h4>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${details.classeColor} bg-opacity-10`}>
                          {details.classe}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>{language === 'fr' ? 'Province' : 'Province'}:</span>
                          <span className="font-medium">{river.province_etat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{language === 'fr' ? 'Région' : 'Region'}:</span>
                          <span className="font-medium">{river.region}</span>
                        </div>
                        {river.nombre_fosses && (
                          <div className="flex justify-between">
                            <span>{language === 'fr' ? 'Fosses' : 'Pools'}:</span>
                            <span className="font-medium">{river.nombre_fosses}</span>
                          </div>
                        )}
                        {river.statut_conditions && (
                          <div className="flex justify-between">
                            <span>{language === 'fr' ? 'Conditions' : 'Conditions'}:</span>
                            <span className={`font-medium ${details.statusColor}`}>
                              {river.statut_conditions}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            {river.latitude?.toFixed(4)}, {river.longitude?.toFixed(4)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Centrer la carte sur cette rivière
                              if (mapRef.current) {
                                mapRef.current.setView([river.latitude, river.longitude], 10);
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title={language === 'fr' ? 'Centrer sur la carte' : 'Center on map'}
                          >
                            <MapPin className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;


