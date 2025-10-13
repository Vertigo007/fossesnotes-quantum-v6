import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BookOpen, Plus, Fish, Calendar, MapPin, Thermometer } from 'lucide-react';

const Journal = () => {
  const { language } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les entrées du journal
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch('/api/journal');
        const data = await response.json();
        if (data.success) {
          setEntries(data.entries);
        }
      } catch (error) {
        console.error('Erreur chargement journal:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'fr' ? 'Journal de Pêche' : 'Fishing Journal'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' 
              ? 'Enregistrez vos sorties et partagez vos expériences'
              : 'Record your trips and share your experiences'
            }
          </p>
        </div>

        <div className="mb-6">
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {language === 'fr' ? 'Nouvelle entrée' : 'New Entry'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Entrées récentes' : 'Recent Entries'}
              </h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Chargement...' : 'Loading...'}
                    </p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-8">
                    <Fish className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Aucune entrée pour le moment' : 'No entries yet'}
                    </p>
                    <button 
                      onClick={() => setShowForm(true)}
                      className="mt-4 btn-primary"
                    >
                      {language === 'fr' ? 'Créer votre première entrée' : 'Create your first entry'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Fonctionnalité en cours de développement' : 'Feature under development'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Statistiques' : 'Statistics'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Total sorties' : 'Total trips'}</span>
                  <span className="font-semibold">{entries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Total prises' : 'Total catches'}</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Rivières visitées' : 'Rivers visited'}</span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Actions rapides' : 'Quick Actions'}
              </h3>
              <div className="space-y-2">
                <button className="w-full btn-primary text-sm">
                  {language === 'fr' ? 'Nouvelle entrée' : 'New Entry'}
                </button>
                <button className="w-full btn-outline text-sm">
                  {language === 'fr' ? 'Exporter journal' : 'Export Journal'}
                </button>
                <button className="w-full btn-outline text-sm">
                  {language === 'fr' ? 'Partager' : 'Share'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal; 