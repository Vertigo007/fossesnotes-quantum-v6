import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Calendar, 
  Clock, 
  Navigation, 
  Route,
  FileText,
  Edit3,
  Eye,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const TravelRoutePlanner = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rivieres, setRivieres] = useState([]);
  const [selectedRivers, setSelectedRivers] = useState([]);
  const [customDestinations, setCustomDestinations] = useState([]);

  // Limites selon le plan
  const planLimits = {
    free: { maxRoutes: 1, maxDestinations: 3 },
    standard: { maxRoutes: 3, maxDestinations: 5 },
    premium: { maxRoutes: 5, maxDestinations: 8 },
    elite: { maxRoutes: 10, maxDestinations: 15 }
  };

  const currentPlan = user?.plan || 'free';
  const limits = planLimits[currentPlan];

  // Charger les rivières
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
      }
    };

    fetchRivieres();
  }, []);

  // Charger les routes existantes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/routes', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setRoutes(data.routes);
        }
      } catch (error) {
        console.error('Erreur chargement routes:', error);
      }
    };

    if (user) {
      fetchRoutes();
    }
  }, [user]);

  // Calculer la distance entre deux points (formule de Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculer le temps de trajet (estimation)
  const calculateTravelTime = (distance) => {
    const avgSpeed = 80; // km/h en moyenne
    return Math.round(distance / avgSpeed * 60); // en minutes
  };

  // Calculer les statistiques de la route
  const calculateRouteStats = (destinations) => {
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 0; i < destinations.length - 1; i++) {
      const current = destinations[i];
      const next = destinations[i + 1];
      
      if (current.latitude && current.longitude && next.latitude && next.longitude) {
        const distance = calculateDistance(
          current.latitude, current.longitude,
          next.latitude, next.longitude
        );
        totalDistance += distance;
        totalTime += calculateTravelTime(distance);
      }
    }

    return {
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalTime: Math.round(totalTime),
      avgDistance: destinations.length > 1 ? Math.round(totalDistance / (destinations.length - 1) * 10) / 10 : 0
    };
  };

  // Ajouter une rivière à la route
  const addRiverToRoute = (river) => {
    if (selectedRivers.length >= limits.maxDestinations) {
      toast.error(language === 'fr' 
        ? `Limite atteinte: ${limits.maxDestinations} destinations maximum pour votre plan`
        : `Limit reached: ${limits.maxDestinations} destinations maximum for your plan`
      );
      return;
    }

    const newDestination = {
      id: `river-${river.id}`,
      name: river.nom,
      type: 'river',
      latitude: river.latitude,
      longitude: river.longitude,
      province: river.province_etat,
      region: river.region,
      classe: river.classe,
      riverData: river
    };

    setSelectedRivers([...selectedRivers, newDestination]);
  };

  // Ajouter une destination personnalisée
  const addCustomDestination = () => {
    if (selectedRivers.length >= limits.maxDestinations) {
      toast.error(language === 'fr' 
        ? `Limite atteinte: ${limits.maxDestinations} destinations maximum pour votre plan`
        : `Limit reached: ${limits.maxDestinations} destinations maximum for your plan`
      );
      return;
    }

    const newDestination = {
      id: `custom-${Date.now()}`,
      name: '',
      type: 'custom',
      latitude: null,
      longitude: null,
      isEditing: true
    };

    setSelectedRivers([...selectedRivers, newDestination]);
  };

  // Supprimer une destination
  const removeDestination = (index) => {
    setSelectedRivers(selectedRivers.filter((_, i) => i !== index));
  };

  // Déplacer une destination
  const moveDestination = (fromIndex, toIndex) => {
    const newDestinations = [...selectedRivers];
    const [movedItem] = newDestinations.splice(fromIndex, 1);
    newDestinations.splice(toIndex, 0, movedItem);
    setSelectedRivers(newDestinations);
  };

  // Sauvegarder la route
  const saveRoute = async () => {
    if (!currentRoute?.name) {
      toast.error(language === 'fr' ? 'Veuillez nommer votre route' : 'Please name your route');
      return;
    }

    if (selectedRivers.length < 2) {
      toast.error(language === 'fr' ? 'Ajoutez au moins 2 destinations' : 'Add at least 2 destinations');
      return;
    }

    setLoading(true);

    try {
      const routeData = {
        name: currentRoute.name,
        description: currentRoute.description || '',
        date: currentRoute.date || new Date().toISOString().split('T')[0],
        destinations: selectedRivers,
        stats: calculateRouteStats(selectedRivers)
      };

      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(routeData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(language === 'fr' ? 'Route sauvegardée !' : 'Route saved!');
        setRoutes([...routes, data.route]);
        resetForm();
      } else {
        toast.error(data.message || (language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving route'));
      }
    } catch (error) {
      console.error('Erreur sauvegarde route:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving route');
    } finally {
      setLoading(false);
    }
  };

  // Générer le PDF
  const generatePDF = async (route) => {
    try {
      const response = await fetch(`/api/routes/${route.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${route.name.replace(/\s+/g, '_')}_route.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(language === 'fr' ? 'PDF téléchargé !' : 'PDF downloaded!');
      } else {
        toast.error(language === 'fr' ? 'Erreur lors de la génération du PDF' : 'Error generating PDF');
      }
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la génération du PDF' : 'Error generating PDF');
    }
  };

  // Supprimer une route
  const deleteRoute = async (routeId) => {
    if (!confirm(language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette route ?' : 'Are you sure you want to delete this route?')) {
      return;
    }

    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(language === 'fr' ? 'Route supprimée !' : 'Route deleted!');
        setRoutes(routes.filter(r => r.id !== routeId));
      } else {
        toast.error(data.message || (language === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting route'));
      }
    } catch (error) {
      console.error('Erreur suppression route:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting route');
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setCurrentRoute(null);
    setSelectedRivers([]);
    setCustomDestinations([]);
    setShowForm(false);
  };

  // Commencer une nouvelle route
  const startNewRoute = () => {
    if (routes.length >= limits.maxRoutes) {
      toast.error(language === 'fr' 
        ? `Limite atteinte: ${limits.maxRoutes} routes maximum pour votre plan`
        : `Limit reached: ${limits.maxRoutes} routes maximum for your plan`
      );
      return;
    }

    setCurrentRoute({
      name: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedRivers([]);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {language === 'fr' ? 'Planificateur de routes' : 'Route Planner'}
            </h2>
            <p className="text-gray-600">
              {language === 'fr' 
                ? `Planifiez vos voyages de pêche (${routes.length}/${limits.maxRoutes} routes, ${limits.maxDestinations} destinations max)`
                : `Plan your fishing trips (${routes.length}/${limits.maxRoutes} routes, ${limits.maxDestinations} destinations max)`
              }
            </p>
          </div>
          <button
            onClick={startNewRoute}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {language === 'fr' ? 'Nouvelle route' : 'New Route'}
          </button>
        </div>
      </div>

      {/* Formulaire de création de route */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'fr' ? 'Créer une nouvelle route' : 'Create New Route'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'fr' ? 'Nom de la route' : 'Route Name'}
              </label>
              <input
                type="text"
                value={currentRoute?.name || ''}
                onChange={(e) => setCurrentRoute({...currentRoute, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={language === 'fr' ? 'Ex: Voyage Québec 2024' : 'Ex: Quebec Trip 2024'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'fr' ? 'Date' : 'Date'}
              </label>
              <input
                type="date"
                value={currentRoute?.date || ''}
                onChange={(e) => setCurrentRoute({...currentRoute, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'fr' ? 'Description' : 'Description'}
              </label>
              <input
                type="text"
                value={currentRoute?.description || ''}
                onChange={(e) => setCurrentRoute({...currentRoute, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={language === 'fr' ? 'Description optionnelle' : 'Optional description'}
              />
            </div>
          </div>

          {/* Sélection des destinations */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">
                {language === 'fr' ? 'Destinations' : 'Destinations'} 
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({selectedRivers.length}/{limits.maxDestinations})
                </span>
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={addCustomDestination}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {language === 'fr' ? 'Destination perso' : 'Custom'}
                </button>
              </div>
            </div>

            {/* Liste des destinations sélectionnées */}
            <div className="space-y-3">
              {selectedRivers.map((destination, index) => (
                <div
                  key={destination.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <MapPin className="w-4 h-4 text-blue-500" />
                  </div>
                  
                  <div className="flex-1">
                    {destination.isEditing ? (
                      <input
                        type="text"
                        value={destination.name}
                        onChange={(e) => {
                          const updated = [...selectedRivers];
                          updated[index].name = e.target.value;
                          setSelectedRivers(updated);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder={language === 'fr' ? 'Nom de la destination' : 'Destination name'}
                      />
                    ) : (
                      <div>
                        <div className="font-medium text-gray-900">{destination.name}</div>
                        {destination.type === 'river' && (
                          <div className="text-sm text-gray-600">
                            {destination.province} • {destination.region}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {index > 0 && (
                      <button
                        onClick={() => moveDestination(index, index - 1)}
                        className="text-gray-400 hover:text-gray-600"
                        title={language === 'fr' ? 'Monter' : 'Move up'}
                      >
                        ↑
                      </button>
                    )}
                    {index < selectedRivers.length - 1 && (
                      <button
                        onClick={() => moveDestination(index, index + 1)}
                        className="text-gray-400 hover:text-gray-600"
                        title={language === 'fr' ? 'Descendre' : 'Move down'}
                      >
                        ↓
                      </button>
                    )}
                    <button
                      onClick={() => removeDestination(index)}
                      className="text-red-500 hover:text-red-700"
                      title={language === 'fr' ? 'Supprimer' : 'Remove'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistiques de la route */}
          {selectedRivers.length >= 2 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">
                {language === 'fr' ? 'Statistiques de la route' : 'Route Statistics'}
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {calculateRouteStats(selectedRivers).totalDistance} km
                  </div>
                  <div className="text-sm text-gray-600">
                    {language === 'fr' ? 'Distance totale' : 'Total distance'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.floor(calculateRouteStats(selectedRivers).totalTime / 60)}h {calculateRouteStats(selectedRivers).totalTime % 60}min
                  </div>
                  <div className="text-sm text-gray-600">
                    {language === 'fr' ? 'Temps de trajet' : 'Travel time'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedRivers.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {language === 'fr' ? 'Destinations' : 'Destinations'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button
              onClick={saveRoute}
              disabled={loading || !currentRoute?.name || selectedRivers.length < 2}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? (language === 'fr' ? 'Sauvegarde...' : 'Saving...') : (language === 'fr' ? 'Sauvegarder' : 'Save')}
            </button>
          </div>
        </div>
      )}

      {/* Sélection des rivières */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'fr' ? 'Sélectionner des rivières' : 'Select Rivers'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rivieres.map((river) => {
              const isSelected = selectedRivers.some(d => d.id === `river-${river.id}`);
              return (
                <div
                  key={river.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => !isSelected && addRiverToRoute(river)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{river.nom}</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      river.classe === 1 ? 'text-red-600 bg-red-100' :
                      river.classe === 2 ? 'text-teal-600 bg-teal-100' :
                      'text-blue-600 bg-blue-100'
                    }`}>
                      {river.classe === 1 ? 'Elite' : river.classe === 2 ? 'Standard' : 'Débutant'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>{river.province_etat} • {river.region}</div>
                    {river.nombre_fosses && (
                      <div>{language === 'fr' ? 'Fosses' : 'Pools'}: {river.nombre_fosses}</div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-2 flex items-center text-blue-600 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {language === 'fr' ? 'Sélectionnée' : 'Selected'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des routes existantes */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {language === 'fr' ? 'Mes routes' : 'My Routes'}
          </h3>
        </div>
        
        <div className="p-6">
          {routes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Route className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{language === 'fr' ? 'Aucune route créée' : 'No routes created'}</p>
              <p className="text-sm">{language === 'fr' ? 'Commencez par créer votre première route' : 'Start by creating your first route'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {routes.map((route) => (
                <div key={route.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{route.name}</h4>
                      {route.description && (
                        <p className="text-sm text-gray-600 mt-1">{route.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(route.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Navigation className="w-4 h-4" />
                          {route.destinations?.length || 0} {language === 'fr' ? 'destinations' : 'destinations'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generatePDF(route)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                        title={language === 'fr' ? 'Télécharger PDF' : 'Download PDF'}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRoute(route.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                        title={language === 'fr' ? 'Supprimer' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Statistiques de la route */}
                  {route.stats && (
                    <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {route.stats.totalDistance} km
                        </div>
                        <div className="text-xs text-gray-600">
                          {language === 'fr' ? 'Distance' : 'Distance'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {Math.floor(route.stats.totalTime / 60)}h {route.stats.totalTime % 60}min
                        </div>
                        <div className="text-xs text-gray-600">
                          {language === 'fr' ? 'Temps' : 'Time'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {route.stats.avgDistance} km
                        </div>
                        <div className="text-xs text-gray-600">
                          {language === 'fr' ? 'Moyenne' : 'Average'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Destinations de la route */}
                  {route.destinations && route.destinations.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        {language === 'fr' ? 'Itinéraire' : 'Itinerary'}
                      </h5>
                      <div className="space-y-2">
                        {route.destinations.map((destination, index) => (
                          <div key={destination.id} className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{destination.name}</div>
                              {destination.type === 'river' && destination.province && (
                                <div className="text-gray-500 text-xs">{destination.province}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelRoutePlanner;



