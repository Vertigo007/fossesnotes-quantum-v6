import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Map, BookOpen, Users, Settings, LogOut, Menu } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">🎣</span>
            </div>
            <span className="text-xl font-bold">FossesNotes QUANTUM</span>
          </Link>

          {/* Navigation principale */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-1 hover:text-blue-200 transition-colors">
              <User size={20} />
              <span>Dashboard</span>
            </Link>
            <Link to="/map" className="flex items-center space-x-1 hover:text-blue-200 transition-colors">
              <Map size={20} />
              <span>Carte</span>
            </Link>
            <Link to="/journal" className="flex items-center space-x-1 hover:text-blue-200 transition-colors">
              <BookOpen size={20} />
              <span>Journal</span>
            </Link>
            <Link to="/community" className="flex items-center space-x-1 hover:text-blue-200 transition-colors">
              <Users size={20} />
              <span>Communauté</span>
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center space-x-1 hover:text-blue-200 transition-colors">
                <Settings size={20} />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Profil utilisateur */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-blue-200">{user.plan}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 