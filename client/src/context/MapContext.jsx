import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const MapContext = createContext();

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};

export const MapProvider = ({ children }) => {
  const [rivers, setRivers] = useState([]);
  const [selectedRiver, setSelectedRiver] = useState(null);
  const [mapCenter, setMapCenter] = useState([46.5653, -66.4619]); // Centre du NB
  const [mapZoom, setMapZoom] = useState(7);
  const [mapType, setMapType] = useState('road'); // road, satellite, terrain, outdoor
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    province: '',
    region: '',
    type: '',
    class: ''
  });

  // Charger les rivières
  const loadRivers = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`/api/rivieres?${params.toString()}`);
      setRivers(response.data.rivieres || response.data.rivers || []);
    } catch (error) {
      setError('Erreur lors du chargement des rivières');
      console.error('Erreur loadRivers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger une rivière spécifique
  const loadRiver = async (riverId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/rivieres/${riverId}`);
      setSelectedRiver(response.data.river);
      return response.data.river;
    } catch (error) {
      setError('Erreur lors du chargement de la rivière');
      console.error('Erreur loadRiver:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Recherche géographique
  const searchNearby = async (latitude, longitude, radius = 50) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/rivieres/geo/proximite', {
        params: { latitude, longitude, radius }
      });
      
      setRivers(response.data.rivieres || response.data.rivers || []);
      setMapCenter([latitude, longitude]);
      setMapZoom(10);
    } catch (error) {
      setError('Erreur lors de la recherche géographique');
      console.error('Erreur searchNearby:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les conditions en temps réel
  const getRealTimeConditions = async (riverId) => {
    try {
      const response = await axios.get(`/api/rivieres/conditions/temps-reel?riverId=${riverId}`);
      return response.data.conditions;
    } catch (error) {
      console.error('Erreur getRealTimeConditions:', error);
      return null;
    }
  };

  // Obtenir les statistiques globales
  const getGlobalStats = async () => {
    try {
      const response = await axios.get('/api/rivieres/stats');
      return response.data.stats;
    } catch (error) {
      console.error('Erreur getGlobalStats:', error);
      return null;
    }
  };

  // Appliquer les filtres
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    loadRivers(newFilters);
  };

  // Centrer la carte sur une rivière
  const centerOnRiver = (river) => {
    if (river && river.latitude && river.longitude) {
      setMapCenter([river.latitude, river.longitude]);
      setMapZoom(12);
      setSelectedRiver(river);
    }
  };

  // Changer le type de carte
  const changeMapType = (type) => {
    setMapType(type);
  };

  // Obtenir les coordonnées GPS actuelles
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(10);
          resolve({ latitude, longitude });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  // Ouvrir les directions GPS
  const openGPSDirections = (river) => {
    if (river && river.latitude && river.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${river.latitude},${river.longitude}`;
      window.open(url, '_blank');
    }
  };

  // Charger les rivières au démarrage
  useEffect(() => {
    loadRivers();
  }, []);

  const value = {
    // État
    rivers,
    selectedRiver,
    mapCenter,
    mapZoom,
    mapType,
    loading,
    error,
    filters,
    
    // Actions
    loadRivers,
    loadRiver,
    searchNearby,
    getRealTimeConditions,
    getGlobalStats,
    applyFilters,
    centerOnRiver,
    changeMapType,
    getCurrentLocation,
    openGPSDirections,
    setSelectedRiver,
    setMapCenter,
    setMapZoom
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}; 