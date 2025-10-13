import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Edit, Trash2, Save, X, Check, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPlans = () => {
  const { language } = useLanguage();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    currency: 'CAD',
    billing_cycle: 'monthly',
    features: {},
    limits: {},
    is_active: true,
    is_popular: false,
    sort_order: 0
  });

  // Charger les plans
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans/admin/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Erreur chargement plans:', error);
      toast.error(language === 'fr' ? 'Erreur chargement plans' : 'Error loading plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingPlan ? `/api/plans/${editingPlan.id}` : '/api/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(editingPlan ? 
          (language === 'fr' ? 'Plan mis à jour' : 'Plan updated') :
          (language === 'fr' ? 'Plan créé' : 'Plan created')
        );
        setShowForm(false);
        setEditingPlan(null);
        resetForm();
        fetchPlans();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Erreur sauvegarde plan:', error);
      toast.error(language === 'fr' ? 'Erreur sauvegarde' : 'Save error');
    }
  };

  const handleDelete = async (planId) => {
    if (!confirm(language === 'fr' ? 'Supprimer ce plan ?' : 'Delete this plan?')) {
      return;
    }

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(language === 'fr' ? 'Plan supprimé' : 'Plan deleted');
        fetchPlans();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Erreur suppression plan:', error);
      toast.error(language === 'fr' ? 'Erreur suppression' : 'Delete error');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency,
      billing_cycle: plan.billing_cycle,
      features: plan.features || {},
      limits: plan.limits || {},
      is_active: plan.is_active,
      is_popular: plan.is_popular,
      sort_order: plan.sort_order
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      currency: 'CAD',
      billing_cycle: 'monthly',
      features: {},
      limits: {},
      is_active: true,
      is_popular: false,
      sort_order: 0
    });
  };

  const addFeature = () => {
    const key = prompt(language === 'fr' ? 'Nom de la fonctionnalité:' : 'Feature name:');
    const value = prompt(language === 'fr' ? 'Description:' : 'Description:');
    if (key && value) {
      setFormData(prev => ({
        ...prev,
        features: { ...prev.features, [key]: value }
      }));
    }
  };

  const removeFeature = (key) => {
    const newFeatures = { ...formData.features };
    delete newFeatures[key];
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'fr' ? 'Gestion des Plans' : 'Plan Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' ? 'Gérez les plans d\'abonnement et leurs fonctionnalités' : 'Manage subscription plans and their features'}
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingPlan(null);
              resetForm();
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {language === 'fr' ? 'Nouveau Plan' : 'New Plan'}
          </button>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingPlan ? 
                  (language === 'fr' ? 'Modifier le Plan' : 'Edit Plan') :
                  (language === 'fr' ? 'Nouveau Plan' : 'New Plan')
                }
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPlan(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Nom' : 'Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Prix' : 'Price'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Devise' : 'Currency'}
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CAD">CAD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Cycle de facturation' : 'Billing Cycle'}
                  </label>
                  <select
                    value={formData.billing_cycle}
                    onChange={(e) => setFormData({...formData, billing_cycle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">{language === 'fr' ? 'Mensuel' : 'Monthly'}</option>
                    <option value="yearly">{language === 'fr' ? 'Annuel' : 'Yearly'}</option>
                    <option value="lifetime">{language === 'fr' ? 'À vie' : 'Lifetime'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Ordre de tri' : 'Sort Order'}
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Description' : 'Description'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Fonctionnalités */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {language === 'fr' ? 'Fonctionnalités' : 'Features'}
                  </label>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + {language === 'fr' ? 'Ajouter' : 'Add'}
                  </button>
                </div>
                <div className="space-y-2">
                  {Object.entries(formData.features).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newFeatures = {...formData.features};
                          delete newFeatures[key];
                          newFeatures[e.target.value] = value;
                          setFormData({...formData, features: newFeatures});
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setFormData({
                          ...formData, 
                          features: {...formData.features, [key]: e.target.value}
                        })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(key)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {language === 'fr' ? 'Actif' : 'Active'}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({...formData, is_popular: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {language === 'fr' ? 'Populaire' : 'Popular'}
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingPlan ? 
                    (language === 'fr' ? 'Mettre à jour' : 'Update') :
                    (language === 'fr' ? 'Créer' : 'Create')
                  }
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="btn-outline"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                    {plan.is_popular && <Star className="w-4 h-4 text-yellow-500 inline ml-2" />}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.price} {plan.currency}/{plan.billing_cycle}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {plan.description}
              </p>

              <div className="space-y-2">
                {Object.entries(plan.features || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>{key}:</strong> {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language === 'fr' ? 'Statut' : 'Status'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    plan.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {plan.is_active ? 
                      (language === 'fr' ? 'Actif' : 'Active') :
                      (language === 'fr' ? 'Inactif' : 'Inactive')
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPlans;



