import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { language } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        login(data.user, data.token);
        toast.success(language === 'fr' ? 'Connexion réussie !' : 'Login successful!');
        navigate('/dashboard');
      } else {
        toast.error(data.message || (language === 'fr' ? 'Erreur de connexion' : 'Login error'));
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      toast.error(language === 'fr' ? 'Erreur de connexion' : 'Login error');
    } finally {
      setLoading(false);
    }
  };

  // Comptes de test pour démonstration
  const testAccounts = [
    { email: 'admin@fossesnotes.test', password: 'admin123', label: 'Admin (Super Admin)' },
    { email: 'elite@fossesnotes.test', password: 'elite123', label: 'Elite (Premium)' },
    { email: 'instructor@fossesnotes.test', password: 'instructor123', label: 'Instructor' },
    { email: 'moderator@fossesnotes.test', password: 'moderator123', label: 'Moderator' },
    { email: 'user1@fossesnotes.test', password: 'user123', label: 'User Basic' },
    { email: 'user2@fossesnotes.test', password: 'user123', label: 'User Free' },
    { email: 'club_admin@fossesnotes.test', password: 'club123', label: 'Club Admin' }
  ];

  const fillTestAccount = (account) => {
    setFormData({
      email: account.email,
      password: account.password
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🎣</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {language === 'fr' ? 'Connexion' : 'Sign in'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {language === 'fr' ? 'Accédez à votre compte FossesNotes' : 'Access your FossesNotes account'}
          </p>
        </div>

        {/* Comptes de test */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            {language === 'fr' ? 'Comptes de test :' : 'Test accounts:'}
          </h3>
          <div className="space-y-2">
            {testAccounts.map((account, index) => (
              <button
                key={index}
                onClick={() => fillTestAccount(account)}
                className="w-full text-left text-sm text-blue-700 hover:text-blue-900 p-2 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <strong>{account.label}:</strong> {account.email}
              </button>
            ))}
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Adresse email' : 'Email address'}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={language === 'fr' ? 'votre@email.com' : 'your@email.com'}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Mot de passe' : 'Password'}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={language === 'fr' ? 'Votre mot de passe' : 'Your password'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                language === 'fr' ? 'Se connecter' : 'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {language === 'fr' ? "Pas encore de compte ?" : "Don't have an account?"}{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {language === 'fr' ? 'Créer un compte' : 'Create account'}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
