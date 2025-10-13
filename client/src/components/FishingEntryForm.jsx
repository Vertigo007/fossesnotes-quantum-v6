import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Fish, Calendar, MapPin, Thermometer, Camera, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const FishingEntryForm = ({ onSave, onCancel, initialData = null }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rivieres, setRivieres] = useState([]);
  const [formData, setFormData] = useState({
    riviere_id: '',
    date_sortie: new Date().toISOString().split('T')[0],
    heure_debut: '',
    heure_fin: '',
    temperature_air: '',
    temperature_eau: '',
    niveau_eau: '',
    conditions_meteo: '',
    nombre_captures: 0,
    especes_capturees: [],
    mouches_utilisees: [],
    observations: '',
    coordonnees_gps: null
  });

  // Charger les rivières
  useEffect(() => {
    const fetchRivieres = async () => {
      try {
        const response = await fetch('/api/rivieres');
        const data = await response.json();
        if (data.rivieres) {
          setRivieres(data.rivieres);
        }
      } catch (error) {
        console.error('Erreur chargement rivières:', error);
      }
    };

    fetchRivieres();
  }, []);

  // Initialiser avec les données existantes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Obtenir la géolocalisation
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            coordonnees_gps: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
          toast.success(language === 'fr' ? 'Position obtenue !' : 'Location obtained!');
        },
        (error) => {
          console.log('Erreur géolocalisation:', error);
          toast.error(language === 'fr' ? 'Impossible d\'obtenir la position' : 'Could not get location');
        }
      );
    }
  };

  // Gérer les changements de formulaire
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Ajouter une espèce capturée
  const addEspece = () => {
    const newEspece = {
      id: Date.now(),
      nom: '',
      taille: '',
      poids: ''
    };
    setFormData(prev => ({
      ...prev,
      especes_capturees: [...prev.especes_capturees, newEspece],
      nombre_captures: prev.nombre_captures + 1
    }));
  };

  // Mettre à jour une espèce
  const updateEspece = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      especes_capturees: prev.especes_capturees.map((espece, i) =>
        i === index ? { ...espece, [field]: value } : espece
      )
    }));
  };

  // Supprimer une espèce
  const removeEspece = (index) => {
    setFormData(prev => ({
      ...prev,
      especes_capturees: prev.especes_capturees.filter((_, i) => i !== index),
      nombre_captures: Math.max(0, prev.nombre_captures - 1)
    }));
  };

  // Sauvegarder l'entrée
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Pour l'instant, juste appeler onSave avec les données
      // Plus tard, on fera un vrai POST à l'API
      const entry = {
        ...formData,
        id: Date.now(),
        user_id: user?.id,
        created_at: new Date().toISOString()
      };
      
      onSave && onSave(entry);
      toast.success(language === 'fr' ? 'Entrée sauvegardée !' : 'Entry saved!');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Fish className="w-6 h-6" />
          {language === 'fr' ? 'Nouvelle Sortie de Pêche' : 'New Fishing Trip'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Rivière' : 'River'} *
            </label>
            <select
              value={formData.riviere_id}
              onChange={(e) => handleChange('riviere_id', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{language === 'fr' ? 'Sélectionner une rivière' : 'Select a river'}</option>
              {rivieres.map((riviere) => (
                <option key={riviere.id} value={riviere.id}>
                  {riviere.nom} - {riviere.province}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Date de sortie' : 'Trip Date'} *
            </label>
            <input
              type="date"
              value={formData.date_sortie}
              onChange={(e) => handleChange('date_sortie', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Heures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Heure de début' : 'Start Time'}
            </label>
            <input
              type="time"
              value={formData.heure_debut}
              onChange={(e) => handleChange('heure_debut', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Heure de fin' : 'End Time'}
            </label>
            <input
              type="time"
              value={formData.heure_fin}
              onChange={(e) => handleChange('heure_fin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Température air (°C)' : 'Air Temperature (°C)'}
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.temperature_air}
              onChange={(e) => handleChange('temperature_air', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Température eau (°C)' : 'Water Temperature (°C)'}
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.temperature_eau}
              onChange={(e) => handleChange('temperature_eau', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Niveau eau (cm)' : 'Water Level (cm)'}
            </label>
            <input
              type="number"
              value={formData.niveau_eau}
              onChange={(e) => handleChange('niveau_eau', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Conditions météo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {language === 'fr' ? 'Conditions météo' : 'Weather Conditions'}
          </label>
          <select
            value={formData.conditions_meteo}
            onChange={(e) => handleChange('conditions_meteo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">{language === 'fr' ? 'Sélectionner' : 'Select'}</option>
            <option value="Ensoleillé">{language === 'fr' ? 'Ensoleillé' : 'Sunny'}</option>
            <option value="Nuageux">{language === 'fr' ? 'Nuageux' : 'Cloudy'}</option>
            <option value="Pluvieux">{language === 'fr' ? 'Pluvieux' : 'Rainy'}</option>
            <option value="Venteux">{language === 'fr' ? 'Venteux' : 'Windy'}</option>
            <option value="Brumeux">{language === 'fr' ? 'Brumeux' : 'Foggy'}</option>
          </select>
        </div>

        {/* Espèces capturées */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === 'fr' ? 'Espèces Capturées' : 'Caught Species'} ({formData.nombre_captures})
            </h3>
            <button
              type="button"
              onClick={addEspece}
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              + {language === 'fr' ? 'Ajouter' : 'Add'}
            </button>
          </div>

          <div className="space-y-4">
            {formData.especes_capturees.map((espece, index) => (
              <div key={espece.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {language === 'fr' ? 'Espèce' : 'Species'} {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeEspece(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder={language === 'fr' ? 'Nom de l\'espèce' : 'Species name'}
                    value={espece.nom}
                    onChange={(e) => updateEspece(index, 'nom', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder={language === 'fr' ? 'Taille (cm)' : 'Size (cm)'}
                    value={espece.taille}
                    onChange={(e) => updateEspece(index, 'taille', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder={language === 'fr' ? 'Poids (kg)' : 'Weight (kg)'}
                    value={espece.poids}
                    onChange={(e) => updateEspece(index, 'poids', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {language === 'fr' ? 'Observations' : 'Observations'}
          </label>
          <textarea
            value={formData.observations}
            onChange={(e) => handleChange('observations', e.target.value)}
            rows={4}
            placeholder={language === 'fr' ? 'Décrivez votre sortie, les conditions, les techniques qui ont fonctionné...' : 'Describe your trip, conditions, techniques that worked...'}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Géolocalisation */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            {language === 'fr' ? 'Géolocaliser' : 'Get Location'}
          </button>
          {formData.coordonnees_gps && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formData.coordonnees_gps.latitude.toFixed(6)}, {formData.coordonnees_gps.longitude.toFixed(6)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {language === 'fr' ? 'Annuler' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? (language === 'fr' ? 'Sauvegarde...' : 'Saving...') : (language === 'fr' ? 'Sauvegarder' : 'Save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FishingEntryForm;

