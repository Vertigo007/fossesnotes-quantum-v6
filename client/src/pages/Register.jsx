import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const { language } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Charger les plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.plans) {
            setPlans(data.plans);
            // Définir le premier plan comme défaut
            if (data.plans.length > 0) {
              setFormData(prev => ({ ...prev, plan: data.plans[0].slug }));
            }
          } else {
            console.error('Format de réponse invalide:', data);
            // Plans par défaut si l'API échoue
            const defaultPlans = [
              { id: 1, name: 'Gratuit', slug: 'free', price: 0, currency: 'CAD', billing_cycle: 'mois', description: 'Accès de base aux fonctionnalités' },
              { id: 2, name: 'Standard', slug: 'basic', price: 9.99, currency: 'CAD', billing_cycle: 'mois', description: 'Accès complet aux rivières et fonctionnalités' },
              { id: 3, name: 'Premium', slug: 'pro', price: 19.99, currency: 'CAD', billing_cycle: 'mois', description: 'Fonctionnalités avancées et support prioritaire' },
              { id: 4, name: 'Elite', slug: 'elite', price: 39.99, currency: 'CAD', billing_cycle: 'mois', description: 'Accès exclusif et fonctionnalités premium' }
            ];
            setPlans(defaultPlans);
            setFormData(prev => ({ ...prev, plan: 'free' }));
          }
        } else {
          console.error('Erreur HTTP:', response.status);
          // Plans par défaut si l'API échoue
          const defaultPlans = [
            { id: 1, name: 'Gratuit', slug: 'free', price: 0, currency: 'CAD', billing_cycle: 'mois', description: 'Accès de base aux fonctionnalités' },
            { id: 2, name: 'Standard', slug: 'basic', price: 9.99, currency: 'CAD', billing_cycle: 'mois', description: 'Accès complet aux rivières et fonctionnalités' },
            { id: 3, name: 'Premium', slug: 'pro', price: 19.99, currency: 'CAD', billing_cycle: 'mois', description: 'Fonctionnalités avancées et support prioritaire' },
            { id: 4, name: 'Elite', slug: 'elite', price: 39.99, currency: 'CAD', billing_cycle: 'mois', description: 'Accès exclusif et fonctionnalités premium' }
          ];
          setPlans(defaultPlans);
          setFormData(prev => ({ ...prev, plan: 'free' }));
        }
      } catch (error) {
        console.error('Erreur chargement plans:', error);
        toast.error(language === 'fr' ? 'Erreur lors du chargement des plans' : 'Error loading plans');
        // Plans par défaut si l'API échoue
        const defaultPlans = [
          { id: 1, name: 'Gratuit', slug: 'free', price: 0, currency: 'CAD', billing_cycle: 'mois', description: 'Accès de base aux fonctionnalités' },
          { id: 2, name: 'Standard', slug: 'basic', price: 9.99, currency: 'CAD', billing_cycle: 'mois', description: 'Accès complet aux rivières et fonctionnalités' },
          { id: 3, name: 'Premium', slug: 'pro', price: 19.99, currency: 'CAD', billing_cycle: 'mois', description: 'Fonctionnalités avancées et support prioritaire' },
          { id: 4, name: 'Elite', slug: 'elite', price: 39.99, currency: 'CAD', billing_cycle: 'mois', description: 'Accès exclusif et fonctionnalités premium' }
        ];
        setPlans(defaultPlans);
        setFormData(prev => ({ ...prev, plan: 'free' }));
      }
    };

    fetchPlans();
  }, [language]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    plan: 'free'
  });
  const [plans, setPlans] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(language === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Vérifier si le plan sélectionné nécessite un paiement
      const selectedPlan = plans.find(p => p.slug === formData.plan);
      const requiresPayment = selectedPlan && ['pro', 'elite'].includes(selectedPlan.slug);

      if (requiresPayment) {
        // Créer le paiement PayPal
        const paymentResponse = await fetch('/api/paypal/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan: selectedPlan.name,
            amount: selectedPlan.price,
            currency: selectedPlan.currency || 'CAD'
          }),
        });

        const paymentData = await paymentResponse.json();

        if (paymentData.success) {
          // Rediriger vers PayPal
          window.location.href = paymentData.approval_url;
          return;
        } else {
          toast.error(language === 'fr' ? 'Erreur lors de la création du paiement' : 'Error creating payment');
          setLoading(false);
          return;
        }
      }

      // Pour les plans gratuits, procéder normalement
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          plan: formData.plan
        }),
      });

      const data = await response.json();

      if (data.success) {
        login(data.user, data.token);
        toast.success(language === 'fr' ? 'Compte créé avec succès !' : 'Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error(data.message || (language === 'fr' ? 'Erreur lors de l\'inscription' : 'Registration error'));
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      toast.error(language === 'fr' ? 'Erreur lors de l\'inscription' : 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🎣</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {language === 'fr' ? 'Créer un compte' : 'Create account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {language === 'fr' ? 'Rejoignez la communauté FossesNotes' : 'Join the FossesNotes community'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Nom complet' : 'Full name'}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={language === 'fr' ? 'Votre nom complet' : 'Your full name'}
                />
              </div>
            </div>

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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Téléphone (optionnel)' : 'Phone (optional)'}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={language === 'fr' ? '+1 (555) 123-4567' : '+1 (555) 123-4567'}
                />
              </div>
            </div>

            <div>
              <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Plan d\'abonnement' : 'Subscription plan'}
              </label>
              <div className="mt-1">
                <select
                  id="plan"
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.slug}>
                      {plan.name} - {plan.price} {plan.currency}/{plan.billing_cycle}
                    </option>
                  ))}
                </select>
              </div>
              {plans.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {plans.find(p => p.slug === formData.plan)?.description}
                </div>
              )}
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
                  autoComplete="new-password"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Confirmer le mot de passe' : 'Confirm password'}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={language === 'fr' ? 'Confirmez votre mot de passe' : 'Confirm your password'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
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
                language === 'fr' ? 'Créer le compte' : 'Create account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {language === 'fr' ? "Déjà un compte ?" : "Already have an account?"}{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {language === 'fr' ? 'Se connecter' : 'Sign in'}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
