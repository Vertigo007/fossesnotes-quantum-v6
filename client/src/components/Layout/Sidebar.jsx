import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  Home, 
  User, 
  Map, 
  BookOpen, 
  Users, 
  Settings, 
  Trophy, 
  BarChart3,
  Calendar,
  MessageSquare,
  Star,
  Award
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: Home, label: 'Accueil', public: true },
    { path: '/dashboard', icon: User, label: 'Dashboard', public: false },
    { path: '/map', icon: Map, label: 'Carte Interactive', public: true },
    { path: '/journal', icon: BookOpen, label: 'Journal de Pêche', public: false },
    { path: '/community', icon: Users, label: 'Communauté', public: true },
    { path: '/competitions', icon: Trophy, label: 'Compétitions', public: true },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', public: false },
    { path: '/calendar', icon: Calendar, label: 'Calendrier', public: false },
    { path: '/messages', icon: MessageSquare, label: 'Messages', public: false },
    { path: '/achievements', icon: Award, label: 'Succès', public: false },
    { path: '/favorites', icon: Star, label: 'Favoris', public: false },
    { path: '/admin', icon: Settings, label: 'Administration', public: false, adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.public || (user && (!item.adminOnly || user.role === 'admin'))
  );

  return (
    <aside className="w-64 bg-white shadow-lg h-screen fixed left-0 top-16 z-10">
      <div className="p-4">
        {/* Profil utilisateur */}
        {user && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.plan}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-500">En ligne</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu de navigation */}
        <nav className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Statistiques rapides */}
        {user && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Statistiques</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Niveau</span>
                <span className="font-medium text-blue-600">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">XP Total</span>
                <span className="font-medium text-green-600">2,450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sorties</span>
                <span className="font-medium text-purple-600">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prises</span>
                <span className="font-medium text-orange-600">47</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar; 