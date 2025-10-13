import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuration axios
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  axios.defaults.headers.common['Content-Type'] = 'application/json';

  // Intercepteur pour ajouter le token JWT
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('fossesnotes-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur pour gérer les erreurs d'authentification
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('fossesnotes-token');
        setUser(null);
      }
      return Promise.reject(error);
    }
  );

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('fossesnotes-token');
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('fossesnotes-token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('fossesnotes-token', token);
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de connexion';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Fonction d'inscription
  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('fossesnotes-token', token);
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur d\'inscription';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('fossesnotes-token');
    setUser(null);
    setError(null);
  };

  // Fonction de mise à jour du profil
  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await axios.put(`/api/users/${user.id}`, userData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de mise à jour';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Fonction pour changer de plan
  const upgradePlan = async (newPlan) => {
    try {
      setError(null);
      const response = await axios.put(`/api/users/${user.id}`, { plan: newPlan });
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de changement de plan';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Fonction pour récupérer le mot de passe
  const forgotPassword = async (email) => {
    try {
      setError(null);
      await axios.post('/api/auth/forgot-password', { email });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de récupération';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Fonction pour réinitialiser le mot de passe
  const resetPassword = async (token, newPassword) => {
    try {
      setError(null);
      await axios.post('/api/auth/reset-password', { token, newPassword });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de réinitialisation';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Fonction pour vérifier les permissions
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Permissions basées sur le plan
    const planPermissions = {
      basic: ['view_rivers', 'create_journal', 'view_community'],
      pro: ['view_rivers', 'create_journal', 'view_community', 'advanced_analytics', 'priority_support'],
      elite: ['view_rivers', 'create_journal', 'view_community', 'advanced_analytics', 'priority_support', 'exclusive_content', 'ai_predictions']
    };

    // Permissions admin
    if (user.role === 'admin') return true;
    
    return planPermissions[user.plan]?.includes(permission) || false;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    upgradePlan,
    forgotPassword,
    resetPassword,
    hasPermission,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 