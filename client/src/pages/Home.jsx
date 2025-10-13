import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { 
  Map, 
  BookOpen, 
  Users, 
  Zap, 
  Shield, 
  Globe, 
  Smartphone, 
  Award,
  ArrowRight,
  Play,
  Star,
  CheckCircle,
  Fish,
  Compass,
  Camera,
  Brain
} from 'lucide-react';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const { isMobile, isPWA, installPWA } = useApp();

  const features = [
    {
      icon: <Map className="w-8 h-8" />,
      title: language === 'fr' ? '18 Rivières Authentiques' : '18 Authentic Rivers',
      description: language === 'fr' 
        ? 'Base de données complète avec coordonnées GPS précises et conditions en temps réel'
        : 'Complete database with precise GPS coordinates and real-time conditions'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: language === 'fr' ? 'IA Prédictive 94%' : '94% Predictive AI',
      description: language === 'fr'
        ? 'Algorithme propriétaire pour prédire les meilleures conditions de pêche'
        : 'Proprietary algorithm to predict the best fishing conditions'
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: language === 'fr' ? 'Reconnaissance AR' : 'AR Recognition',
      description: language === 'fr'
        ? 'Identification automatique des espèces de poissons en temps réel'
        : 'Real-time automatic fish species identification'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: language === 'fr' ? 'Blockchain NFT' : 'Blockchain NFT',
      description: language === 'fr'
        ? 'Enregistrement sécurisé des prises et records de pêche'
        : 'Secure recording of catches and fishing records'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: language === 'fr' ? 'IoT Capteurs' : 'IoT Sensors',
      description: language === 'fr'
        ? 'Capteurs intelligents pour surveiller les conditions des rivières'
        : 'Smart sensors to monitor river conditions'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: language === 'fr' ? 'Gamification AAA' : 'AAA Gamification',
      description: language === 'fr'
        ? 'Système de points, badges et défis pour motiver les pêcheurs'
        : 'Points, badges and challenges system to motivate anglers'
    }
  ];

  const plans = [
    {
      name: language === 'fr' ? 'Basique' : 'Basic',
      price: language === 'fr' ? 'Gratuit' : 'Free',
      features: [
        language === 'fr' ? 'Accès aux 18 rivières' : 'Access to 18 rivers',
        language === 'fr' ? 'Carte interactive' : 'Interactive map',
        language === 'fr' ? 'Journal de pêche' : 'Fishing journal',
        language === 'fr' ? 'Communauté de base' : 'Basic community'
      ],
      popular: false
    },
    {
      name: language === 'fr' ? 'Professionnel' : 'Professional',
      price: language === 'fr' ? '29$/mois' : '$29/month',
      features: [
        language === 'fr' ? 'Tout du plan Basique' : 'Everything in Basic',
        language === 'fr' ? 'IA prédictive avancée' : 'Advanced predictive AI',
        language === 'fr' ? 'Analytics détaillées' : 'Detailed analytics',
        language === 'fr' ? 'Support prioritaire' : 'Priority support'
      ],
      popular: true
    },
    {
      name: language === 'fr' ? 'Élite' : 'Elite',
      price: language === 'fr' ? '99$/mois' : '$99/month',
      features: [
        language === 'fr' ? 'Tout du plan Pro' : 'Everything in Professional',
        language === 'fr' ? 'Contenu exclusif' : 'Exclusive content',
        language === 'fr' ? 'AR reconnaissance' : 'AR recognition',
        language === 'fr' ? 'Blockchain NFT' : 'Blockchain NFT'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-green-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                <Fish className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                FossesNotes
              </span>
              <br />
              <span className="text-3xl md:text-4xl text-gray-700 dark:text-gray-300">
                QUANTUM v6.0
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              {language === 'fr' 
                ? 'L\'écosystème révolutionnaire de pêche à la mouche pour le Canada Atlantique'
                : 'The revolutionary fly fishing ecosystem for Atlantic Canada'
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn-primary text-lg px-8 py-4 flex items-center gap-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  {language === 'fr' ? 'Accéder au Dashboard' : 'Access Dashboard'}
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-primary text-lg px-8 py-4 flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    {language === 'fr' ? 'Commencer Gratuitement' : 'Start Free'}
                  </Link>
                  <Link
                    to="/login"
                    className="btn-outline text-lg px-8 py-4"
                  >
                    {language === 'fr' ? 'Se Connecter' : 'Login'}
                  </Link>
                </>
              )}
            </div>

            {/* Language Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
                <button
                  onClick={() => changeLanguage('fr')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    language === 'fr'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  🇫🇷 Français
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">18</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? 'Rivières' : 'Rivers'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">94%</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? 'Précision IA' : 'AI Accuracy'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">6</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? 'Applications' : 'Apps'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">∞</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? 'Possibilités' : 'Possibilities'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {language === 'fr' ? 'Technologies Révolutionnaires' : 'Revolutionary Technologies'}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {language === 'fr' 
                ? 'Une combinaison unique de technologies de pointe pour une expérience de pêche inégalée'
                : 'A unique combination of cutting-edge technologies for an unparalleled fishing experience'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-xl transition-shadow duration-300">
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {language === 'fr' ? 'Choisissez Votre Plan' : 'Choose Your Plan'}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {language === 'fr' 
                ? 'Des options flexibles pour tous les types de pêcheurs'
                : 'Flexible options for all types of anglers'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`card relative ${
                  plan.popular
                    ? 'ring-2 ring-blue-600 transform scale-105'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {language === 'fr' ? 'Populaire' : 'Popular'}
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-4xl font-bold text-blue-600 mb-6">
                    {plan.price}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={isAuthenticated ? "/dashboard" : "/register"}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                    }`}
                  >
                    {language === 'fr' ? 'Commencer' : 'Get Started'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            {language === 'fr' 
              ? 'Prêt à Révolutionner Votre Pêche ?'
              : 'Ready to Revolutionize Your Fishing?'
            }
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {language === 'fr'
              ? 'Rejoignez la communauté FossesNotes et découvrez une nouvelle façon de pêcher'
              : 'Join the FossesNotes community and discover a new way to fish'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              {language === 'fr' ? 'Commencer Maintenant' : 'Start Now'}
            </Link>
            <Link
              to="/map"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              {language === 'fr' ? 'Explorer la Carte' : 'Explore Map'}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Fish className="w-8 h-8 text-blue-400 mr-2" />
                <span className="text-xl font-bold">FossesNotes</span>
              </div>
              <p className="text-gray-400">
                {language === 'fr'
                  ? 'L\'écosystème de pêche à la mouche le plus avancé du Canada Atlantique'
                  : 'The most advanced fly fishing ecosystem in Atlantic Canada'
                }
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">
                {language === 'fr' ? 'Produit' : 'Product'}
              </h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/map" className="hover:text-white">{language === 'fr' ? 'Carte' : 'Map'}</Link></li>
                <li><Link to="/journal" className="hover:text-white">{language === 'fr' ? 'Journal' : 'Journal'}</Link></li>
                <li><Link to="/community" className="hover:text-white">{language === 'fr' ? 'Communauté' : 'Community'}</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">
                {language === 'fr' ? 'Support' : 'Support'}
              </h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">{language === 'fr' ? 'Aide' : 'Help'}</a></li>
                <li><a href="#" className="hover:text-white">{language === 'fr' ? 'Contact' : 'Contact'}</a></li>
                <li><a href="#" className="hover:text-white">{language === 'fr' ? 'FAQ' : 'FAQ'}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">
                {language === 'fr' ? 'Légal' : 'Legal'}
              </h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">{language === 'fr' ? 'Confidentialité' : 'Privacy'}</a></li>
                <li><a href="#" className="hover:text-white">{language === 'fr' ? 'Conditions' : 'Terms'}</a></li>
                <li><a href="#" className="hover:text-white">{language === 'fr' ? 'Licence' : 'License'}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FossesNotes QUANTUM. {language === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 