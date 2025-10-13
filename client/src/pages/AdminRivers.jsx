import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminRivers = () => {
  const { language } = useLanguage();
  const [rivers, setRivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRiver, setEditingRiver] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterClasse, setFilterClasse] = useState('');

  // État du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    nom_anglais: '',
    pays: 'Canada',
    province_etat: '',
    region: '',
    type: 'Rivière',
    classe: 'Débutant',
    latitude: '',
    longitude: '',
    bassin_versant_km2: '',
    longueur_km: '',
    nombre_fosses: '',
    difficulte_acces: 'Facile',
    saison_principale: 'Été',
    niveau_eau: 'Normal',
    debit_m3s: '',
    temperature_eau: '',
    clarte: 'Claire',
    statut_conservation: 'Bon',
    population_saumon: '',
    taille_moyenne_saumon: '',
    record_saumon: '',
    mouches_recommandees: '',
    techniques_recommandees: '',
    reglementation: '',
    permis_requis: 'Oui',
    tirage_au_sort: 'Non',
    url_tirage: '',
    camping_autorise: 'Oui',
    guides_disponibles: 'Non',
    lodges_proches: '',
    historique: '',
    notes_privilegees: ''
  });

  // Options pour les champs enum
  const options = {
    pays: ['Canada', 'États-Unis'],
    province_etat: ['Québec', 'Nouveau-Brunswick', 'Nouvelle-Écosse', 'Terre-Neuve-et-Labrador', 'Maine', 'New York'],
    type: ['Rivière', 'Ruisseau', 'Fleuve'],
    classe: ['Débutant', 'Standard', 'Elite'],
    difficulte_acces: ['Facile', 'Modéré', 'Difficile', 'Très difficile'],
    saison_principale: ['Printemps', 'Été', 'Automne', 'Hiver'],
    niveau_eau: ['Bas', 'Normal', 'Élevé', 'Très élevé'],
    clarte: ['Claire', 'Trouble', 'Très trouble'],
    statut_conservation: ['Excellent', 'Bon', 'Moyen', 'Préoccupant'],
    permis_requis: ['Oui', 'Non'],
    tirage_au_sort: ['Oui', 'Non'],
    camping_autorise: ['Oui', 'Non'],
    guides_disponibles: ['Oui', 'Non']
  };

  useEffect(() => {
    fetchRivers();
  }, []);

  const fetchRivers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rivieres');
      if (response.ok) {
        const data = await response.json();
        setRivers(data);
      } else {
        throw new Error('Erreur lors du chargement des rivières');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(language === 'fr' ? 'Erreur lors du chargement des rivières' : 'Error loading rivers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (e) => {
    const { name, value } = e.target;
    // Convertir la chaîne en tableau (séparée par des virgules)
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [name]: arrayValue
    }));
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      nom_anglais: '',
      pays: 'Canada',
      province_etat: '',
      region: '',
      type: 'Rivière',
      classe: 'Débutant',
      latitude: '',
      longitude: '',
      bassin_versant_km2: '',
      longueur_km: '',
      nombre_fosses: '',
      difficulte_acces: 'Facile',
      saison_principale: 'Été',
      niveau_eau: 'Normal',
      debit_m3s: '',
      temperature_eau: '',
      clarte: 'Claire',
      statut_conservation: 'Bon',
      population_saumon: '',
      taille_moyenne_saumon: '',
      record_saumon: '',
      mouches_recommandees: '',
      techniques_recommandees: '',
      reglementation: '',
      permis_requis: 'Oui',
      tirage_au_sort: 'Non',
      url_tirage: '',
      camping_autorise: 'Oui',
      guides_disponibles: 'Non',
      lodges_proches: '',
      historique: '',
      notes_privilegees: ''
    });
    setEditingRiver(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingRiver 
        ? `/api/rivieres/${editingRiver.id}` 
        : '/api/rivieres';
      
      const method = editingRiver ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(
          editingRiver 
            ? (language === 'fr' ? 'Rivière mise à jour avec succès' : 'River updated successfully')
            : (language === 'fr' ? 'Rivière ajoutée avec succès' : 'River added successfully')
        );
        setShowForm(false);
        resetForm();
        fetchRivers();
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving river');
    }
  };

  const handleEdit = (river) => {
    setEditingRiver(river);
    setFormData({
      nom: river.nom || '',
      nom_anglais: river.nom_anglais || '',
      pays: river.pays || 'Canada',
      province_etat: river.province_etat || '',
      region: river.region || '',
      type: river.type || 'Rivière',
      classe: river.classe || 'Débutant',
      latitude: river.latitude || '',
      longitude: river.longitude || '',
      bassin_versant_km2: river.bassin_versant_km2 || '',
      longueur_km: river.longueur_km || '',
      nombre_fosses: river.nombre_fosses || '',
      difficulte_acces: river.difficulte_acces || 'Facile',
      saison_principale: river.saison_principale || 'Été',
      niveau_eau: river.niveau_eau || 'Normal',
      debit_m3s: river.debit_m3s || '',
      temperature_eau: river.temperature_eau || '',
      clarte: river.clarte || 'Claire',
      statut_conservation: river.statut_conservation || 'Bon',
      population_saumon: river.population_saumon || '',
      taille_moyenne_saumon: river.taille_moyenne_saumon || '',
      record_saumon: river.record_saumon || '',
      mouches_recommandees: Array.isArray(river.mouches_recommandees) ? river.mouches_recommandees.join(', ') : river.mouches_recommandees || '',
      techniques_recommandees: Array.isArray(river.techniques_recommandees) ? river.techniques_recommandees.join(', ') : river.techniques_recommandees || '',
      reglementation: river.reglementation || '',
      permis_requis: river.permis_requis || 'Oui',
      tirage_au_sort: river.tirage_au_sort || 'Non',
      url_tirage: river.url_tirage || '',
      camping_autorise: river.camping_autorise || 'Oui',
      guides_disponibles: river.guides_disponibles || 'Non',
      lodges_proches: Array.isArray(river.lodges_proches) ? river.lodges_proches.join(', ') : river.lodges_proches || '',
      historique: river.historique || '',
      notes_privilegees: river.notes_privilegees || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (riverId) => {
    if (!confirm(language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette rivière ?' : 'Are you sure you want to delete this river?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rivieres/${riverId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success(language === 'fr' ? 'Rivière supprimée avec succès' : 'River deleted successfully');
        fetchRivers();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting river');
    }
  };

  const filteredRivers = rivers.filter(river => {
    const matchesSearch = river.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         river.nom_anglais.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         river.province_etat.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = !filterProvince || river.province_etat === filterProvince;
    const matchesClasse = !filterClasse || river.classe === filterClasse;
    
    return matchesSearch && matchesProvince && matchesClasse;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'fr' ? 'Gestion des Rivières' : 'River Management'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' 
              ? 'Ajoutez, modifiez et gérez les rivières à saumon'
              : 'Add, edit and manage salmon rivers'
            }
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'fr' ? 'Ajouter une rivière' : 'Add River'}</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Rechercher' : 'Search'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'fr' ? 'Nom de la rivière...' : 'River name...'}
                className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Province/État' : 'Province/State'}
            </label>
            <select
              value={filterProvince}
              onChange={(e) => setFilterProvince(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{language === 'fr' ? 'Toutes' : 'All'}</option>
              {options.province_etat.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Classe' : 'Class'}
            </label>
            <select
              value={filterClasse}
              onChange={(e) => setFilterClasse(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{language === 'fr' ? 'Toutes' : 'All'}</option>
              {options.classe.map(classe => (
                <option key={classe} value={classe}>{classe}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterProvince('');
                setFilterClasse('');
              }}
              className="btn-outline w-full flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>{language === 'fr' ? 'Réinitialiser' : 'Reset'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout/modification */}
      {showForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingRiver 
                ? (language === 'fr' ? 'Modifier la rivière' : 'Edit River')
                : (language === 'fr' ? 'Ajouter une nouvelle rivière' : 'Add New River')
              }
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Nom (français)' : 'Name (French)'} *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Nom (anglais)' : 'Name (English)'}
                </label>
                <input
                  type="text"
                  name="nom_anglais"
                  value={formData.nom_anglais}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Pays' : 'Country'} *
                </label>
                <select
                  name="pays"
                  value={formData.pays}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.pays.map(pays => (
                    <option key={pays} value={pays}>{pays}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Province/État' : 'Province/State'} *
                </label>
                <select
                  name="province_etat"
                  value={formData.province_etat}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{language === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                  {options.province_etat.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Région' : 'Region'}
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Type' : 'Type'}
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.type.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Classe' : 'Class'} *
                </label>
                <select
                  name="classe"
                  value={formData.classe}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.classe.map(classe => (
                    <option key={classe} value={classe}>{classe}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Bassin versant (km²)' : 'Watershed (km²)'}
                </label>
                <input
                  type="number"
                  step="any"
                  name="bassin_versant_km2"
                  value={formData.bassin_versant_km2}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Longueur (km)' : 'Length (km)'}
                </label>
                <input
                  type="number"
                  step="any"
                  name="longueur_km"
                  value={formData.longueur_km}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Nombre de fosses' : 'Number of pools'}
                </label>
                <input
                  type="number"
                  name="nombre_fosses"
                  value={formData.nombre_fosses}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Conditions et accès */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Difficulté d\'accès' : 'Access Difficulty'}
                </label>
                <select
                  name="difficulte_acces"
                  value={formData.difficulte_acces}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.difficulte_acces.map(difficulte => (
                    <option key={difficulte} value={difficulte}>{difficulte}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Saison principale' : 'Main Season'}
                </label>
                <select
                  name="saison_principale"
                  value={formData.saison_principale}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.saison_principale.map(saison => (
                    <option key={saison} value={saison}>{saison}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Niveau d\'eau' : 'Water Level'}
                </label>
                <select
                  name="niveau_eau"
                  value={formData.niveau_eau}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.niveau_eau.map(niveau => (
                    <option key={niveau} value={niveau}>{niveau}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Débit (m³/s)' : 'Flow (m³/s)'}
                </label>
                <input
                  type="number"
                  step="any"
                  name="debit_m3s"
                  value={formData.debit_m3s}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Température de l\'eau (°C)' : 'Water Temperature (°C)'}
                </label>
                <input
                  type="number"
                  step="any"
                  name="temperature_eau"
                  value={formData.temperature_eau}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Clarté' : 'Clarity'}
                </label>
                <select
                  name="clarte"
                  value={formData.clarte}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.clarte.map(clarte => (
                    <option key={clarte} value={clarte}>{clarte}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Informations sur le saumon */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Statut de conservation' : 'Conservation Status'}
                </label>
                <select
                  name="statut_conservation"
                  value={formData.statut_conservation}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.statut_conservation.map(statut => (
                    <option key={statut} value={statut}>{statut}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Population de saumon' : 'Salmon Population'}
                </label>
                <input
                  type="text"
                  name="population_saumon"
                  value={formData.population_saumon}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Taille moyenne (cm)' : 'Average Size (cm)'}
                </label>
                <input
                  type="number"
                  step="any"
                  name="taille_moyenne_saumon"
                  value={formData.taille_moyenne_saumon}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Record (cm)' : 'Record (cm)'}
                </label>
                <input
                  type="number"
                  step="any"
                  name="record_saumon"
                  value={formData.record_saumon}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Techniques et réglementation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Mouches recommandées' : 'Recommended Flies'}
                  <span className="text-xs text-gray-500 ml-1">
                    ({language === 'fr' ? 'séparées par des virgules' : 'comma separated'})
                  </span>
                </label>
                <input
                  type="text"
                  name="mouches_recommandees"
                  value={formData.mouches_recommandees}
                  onChange={handleArrayInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Techniques recommandées' : 'Recommended Techniques'}
                  <span className="text-xs text-gray-500 ml-1">
                    ({language === 'fr' ? 'séparées par des virgules' : 'comma separated'})
                  </span>
                </label>
                <input
                  type="text"
                  name="techniques_recommandees"
                  value={formData.techniques_recommandees}
                  onChange={handleArrayInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'fr' ? 'Réglementation' : 'Regulations'}
              </label>
              <textarea
                name="reglementation"
                value={formData.reglementation}
                onChange={handleInputChange}
                rows="3"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Permis et accès */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Permis requis' : 'Permit Required'}
                </label>
                <select
                  name="permis_requis"
                  value={formData.permis_requis}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.permis_requis.map(permis => (
                    <option key={permis} value={permis}>{permis}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Tirage au sort' : 'Lottery'}
                </label>
                <select
                  name="tirage_au_sort"
                  value={formData.tirage_au_sort}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.tirage_au_sort.map(tirage => (
                    <option key={tirage} value={tirage}>{tirage}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Camping autorisé' : 'Camping Allowed'}
                </label>
                <select
                  name="camping_autorise"
                  value={formData.camping_autorise}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.camping_autorise.map(camping => (
                    <option key={camping} value={camping}>{camping}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Guides disponibles' : 'Guides Available'}
                </label>
                <select
                  name="guides_disponibles"
                  value={formData.guides_disponibles}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {options.guides_disponibles.map(guides => (
                    <option key={guides} value={guides}>{guides}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'fr' ? 'URL du tirage au sort' : 'Lottery URL'}
              </label>
              <input
                type="url"
                name="url_tirage"
                value={formData.url_tirage}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'fr' ? 'Lodges à proximité' : 'Nearby Lodges'}
                <span className="text-xs text-gray-500 ml-1">
                  ({language === 'fr' ? 'séparés par des virgules' : 'comma separated'})
                </span>
              </label>
              <input
                type="text"
                name="lodges_proches"
                value={formData.lodges_proches}
                onChange={handleArrayInputChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Notes et historique */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Historique' : 'History'}
                </label>
                <textarea
                  name="historique"
                  value={formData.historique}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Notes privilégiées' : 'Privileged Notes'}
                </label>
                <textarea
                  name="notes_privilegees"
                  value={formData.notes_privilegees}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn-outline"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingRiver 
                  ? (language === 'fr' ? 'Mettre à jour' : 'Update')
                  : (language === 'fr' ? 'Ajouter' : 'Add')
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des rivières */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>{language === 'fr' ? 'Nom' : 'Name'}</th>
                <th>{language === 'fr' ? 'Province/État' : 'Province/State'}</th>
                <th>{language === 'fr' ? 'Classe' : 'Class'}</th>
                <th>{language === 'fr' ? 'Fosses' : 'Pools'}</th>
                <th>{language === 'fr' ? 'Actions' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredRivers.map((river) => (
                <tr key={river.id} className="table-row">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {river.nom}
                      </div>
                      {river.nom_anglais && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {river.nom_anglais}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {river.province_etat}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {river.pays}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${
                      river.classe === 'Elite' ? 'badge-primary' :
                      river.classe === 'Standard' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {river.classe}
                    </span>
                  </td>
                  <td className="table-cell">
                    {river.nombre_fosses || '-'}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(river)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                        title={language === 'fr' ? 'Modifier' : 'Edit'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(river.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-800"
                        title={language === 'fr' ? 'Supprimer' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRivers.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {language === 'fr' 
                ? 'Aucune rivière trouvée. Ajoutez votre première rivière !'
                : 'No rivers found. Add your first river!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRivers;



