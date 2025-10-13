import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Settings, Users, BarChart3, Shield, Eye, LogOut, MapPin } from 'lucide-react';
import AdminRivers from './AdminRivers';

const Admin = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [simulatedUser, setSimulatedUser] = useState(null);

  const stats = [
    { title: language === 'fr' ? 'Utilisateurs' : 'Users', value: '1,247', change: '+12%' },
    { title: language === 'fr' ? 'Posts' : 'Posts', value: '3,456', change: '+8%' },
    { title: language === 'fr' ? 'Rivières' : 'Rivers', value: '18', change: '0%' },
    { title: language === 'fr' ? 'Revenus' : 'Revenue', value: '$12,450', change: '+15%' }
  ];

  const users = [
    { id: 1, name: 'Michel Dubois', email: 'michel@test.com', plan: 'Basic', status: 'active' },
    { id: 2, name: 'Sophie Tremblay', email: 'sophie@test.com', plan: 'Pro', status: 'active' },
    { id: 3, name: 'Jean-Pierre Bouchard', email: 'jp@test.com', plan: 'Elite', status: 'active' }
  ];

  const handleLoginAsUser = (user) => {
    setSimulatedUser(user);
  };

  const handleLogoutFromUser = () => {
    setSimulatedUser(null);
  };

  if (simulatedUser) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Simulation Banner */}
          <div className="bg-red-600 text-white p-4 rounded-lg mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5" />
                <span className="font-semibold">
                  {language === 'fr' ? 'Mode Simulation Actif' : 'Simulation Mode Active'}
                </span>
              </div>
              <button
                onClick={handleLogoutFromUser}
                className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{language === 'fr' ? 'Quitter simulation' : 'Exit Simulation'}</span>
              </button>
            </div>
            <p className="mt-2 text-red-100">
              {language === 'fr' 
                ? `Vous simulez actuellement l'utilisateur: ${simulatedUser.name} (${simulatedUser.plan})`
                : `You are currently simulating user: ${simulatedUser.name} (${simulatedUser.plan})`
              }
            </p>
          </div>

          {/* Simulated User Dashboard */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {simulatedUser.name.charAt(0)}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {simulatedUser.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {simulatedUser.email} • {simulatedUser.plan}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {language === 'fr' ? 'Sorties' : 'Trips'}
                </h3>
                <p className="text-3xl font-bold text-blue-600">12</p>
              </div>
              <div className="card text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {language === 'fr' ? 'Prises' : 'Catches'}
                </h3>
                <p className="text-3xl font-bold text-green-600">28</p>
              </div>
              <div className="card text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {language === 'fr' ? 'Niveau' : 'Level'}
                </h3>
                <p className="text-3xl font-bold text-purple-600">8</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'fr' ? 'Administration' : 'Administration'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' 
              ? 'Gérez votre application FossesNotes QUANTUM'
              : 'Manage your FossesNotes QUANTUM application'
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'dashboard', label: language === 'fr' ? 'Tableau de bord' : 'Dashboard', icon: BarChart3 },
                { id: 'users', label: language === 'fr' ? 'Utilisateurs' : 'Users', icon: Users },
                { id: 'rivers', label: language === 'fr' ? 'Rivières' : 'Rivers', icon: MapPin },
                { id: 'system', label: language === 'fr' ? 'Système' : 'System', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <p className="text-sm text-green-600">
                        {stat.change}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {language === 'fr' ? 'Gestion des utilisateurs' : 'User Management'}
                </h2>
                <button className="btn-primary">
                  {language === 'fr' ? 'Ajouter utilisateur' : 'Add User'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th>{language === 'fr' ? 'Nom' : 'Name'}</th>
                      <th>Email</th>
                      <th>{language === 'fr' ? 'Plan' : 'Plan'}</th>
                      <th>{language === 'fr' ? 'Statut' : 'Status'}</th>
                      <th>{language === 'fr' ? 'Actions' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {users.map((user) => (
                      <tr key={user.id} className="table-row">
                        <td className="table-cell">{user.name}</td>
                        <td className="table-cell">{user.email}</td>
                        <td className="table-cell">
                          <span className={`badge ${
                            user.plan === 'Elite' ? 'badge-primary' :
                            user.plan === 'Pro' ? 'badge-success' : 'badge-warning'
                          }`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="badge badge-success">
                            {user.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleLoginAsUser(user)}
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-sm">
                                {language === 'fr' ? 'Simuler' : 'Simulate'}
                              </span>
                            </button>
                            <button className="text-gray-600 hover:text-gray-800">
                              <Shield className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rivers' && (
          <AdminRivers />
        )}

        {activeTab === 'system' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language === 'fr' ? 'Configuration système' : 'System Configuration'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'fr' ? 'Mode maintenance' : 'Maintenance Mode'}
                    </label>
                    <button className="btn-outline w-full">
                      {language === 'fr' ? 'Activer/Désactiver' : 'Enable/Disable'}
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'fr' ? 'Sauvegarde' : 'Backup'}
                    </label>
                    <button className="btn-primary w-full">
                      {language === 'fr' ? 'Créer sauvegarde' : 'Create Backup'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language === 'fr' ? 'Logs système' : 'System Logs'}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Erreurs' : 'Errors'}
                    </span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Avertissements' : 'Warnings'}
                    </span>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Requêtes API' : 'API Requests'}
                    </span>
                    <span className="font-medium">1,234</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin; 