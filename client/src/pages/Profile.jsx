import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  User, Camera, Shield, Trophy, Settings, CreditCard, 
  Eye, EyeOff, Lock, Globe, Share2, Save, Edit3,
  MapPin, Calendar, Fish, Target, Star, Award, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // États du formulaire
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    experience: user?.experience || 'Débutant',
    avatar: user?.avatar || null
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: user?.profileVisible !== false,
    shareFishingData: user?.shareFishingData || false,
    showLocation: user?.showLocation !== false,
    allowMessages: user?.allowMessages !== false,
    emailNotifications: user?.emailNotifications !== false
  });

  const [plans, setPlans] = useState([]);
  const [userStats, setUserStats] = useState({
    totalTrips: 0,
    totalCatches: 0,
    level: 1,
    experience: 0,
    badges: [],
    achievements: []
  });

  // Charger les plans disponibles
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPlans(data.plans);
          }
        }
      } catch (error) {
        console.error('Erreur chargement plans:', error);
      }
    };

    fetchPlans();
  }, []);

  // Charger les statistiques utilisateur
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await fetch('/api/users/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserStats(data);
        }
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      }
    };

    fetchUserStats();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrivacyChange = (setting) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          avatar: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (data.success) {
        updateUser(data.user);
        toast.success(language === 'fr' ? 'Profil mis à jour avec succès' : 'Profile updated successfully');
      } else {
        toast.error(data.message || (language === 'fr' ? 'Erreur lors de la mise à jour' : 'Update error'));
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la mise à jour' : 'Update error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(language === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(language === 'fr' ? 'Mot de passe modifié avec succès' : 'Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(data.message || (language === 'fr' ? 'Erreur lors du changement' : 'Change error'));
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      toast.error(language === 'fr' ? 'Erreur lors du changement' : 'Change error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacySave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(privacySettings)
      });

      const data = await response.json();

      if (data.success) {
        updateUser(data.user);
        toast.success(language === 'fr' ? 'Paramètres sauvegardés' : 'Settings saved');
      } else {
        toast.error(data.message || (language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Save error'));
      }
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Save error');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (newPlanSlug) => {
    const newPlan = plans.find(p => p.slug === newPlanSlug);
    if (!newPlan) return;

    if (['pro', 'elite'].includes(newPlanSlug)) {
      // Rediriger vers PayPal pour les plans payants
      try {
        const response = await fetch('/api/paypal/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            plan: newPlan.name,
            amount: newPlan.price,
            currency: newPlan.currency || 'CAD',
            userId: user.id
          })
        });

        const data = await response.json();
        if (data.success) {
          window.location.href = data.approval_url;
        } else {
          toast.error(language === 'fr' ? 'Erreur lors de la création du paiement' : 'Error creating payment');
        }
      } catch (error) {
        console.error('Erreur changement plan:', error);
        toast.error(language === 'fr' ? 'Erreur lors du changement de plan' : 'Error changing plan');
      }
    } else {
      // Plan gratuit - mise à jour directe
      try {
        const response = await fetch('/api/users/plan', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ plan: newPlanSlug })
        });

        const data = await response.json();
        if (data.success) {
          updateUser(data.user);
          toast.success(language === 'fr' ? 'Plan modifié avec succès' : 'Plan changed successfully');
        } else {
          toast.error(data.message || (language === 'fr' ? 'Erreur lors du changement' : 'Change error'));
        }
      } catch (error) {
        console.error('Erreur changement plan:', error);
        toast.error(language === 'fr' ? 'Erreur lors du changement de plan' : 'Error changing plan');
      }
    }
  };

  const getLevelProgress = () => {
    const currentLevel = userStats.level;
    const currentExp = userStats.experience;
    const expForNextLevel = currentLevel * 1000;
    return Math.min((currentExp / expForNextLevel) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'fr' ? 'Mon Profil' : 'My Profile'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' 
              ? 'Gérez votre profil, vos paramètres et vos abonnements'
              : 'Manage your profile, settings and subscriptions'
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'profile', label: language === 'fr' ? 'Profil' : 'Profile', icon: User },
                { id: 'stats', label: language === 'fr' ? 'Statistiques' : 'Stats', icon: Trophy },
                { id: 'subscription', label: language === 'fr' ? 'Abonnement' : 'Subscription', icon: CreditCard },
                { id: 'privacy', label: language === 'fr' ? 'Confidentialité' : 'Privacy', icon: Shield }
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

        {/* Contenu des onglets */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Photo de profil */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Photo de profil' : 'Profile Picture'}
              </h3>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {profileData.avatar ? (
                      <img 
                        src={profileData.avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'fr' 
                      ? 'Cliquez sur l\'icône pour changer votre photo'
                      : 'Click the icon to change your photo'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Informations personnelles' : 'Personal Information'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Nom complet' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Téléphone' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Localisation' : 'Location'}
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleProfileChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Niveau d\'expérience' : 'Experience Level'}
                  </label>
                  <select
                    name="experience"
                    value={profileData.experience}
                    onChange={handleProfileChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Débutant">{language === 'fr' ? 'Débutant' : 'Beginner'}</option>
                    <option value="Intermédiaire">{language === 'fr' ? 'Intermédiaire' : 'Intermediate'}</option>
                    <option value="Avancé">{language === 'fr' ? 'Avancé' : 'Advanced'}</option>
                    <option value="Expert">{language === 'fr' ? 'Expert' : 'Expert'}</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Bio' : 'Bio'}
                </label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  rows="4"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={language === 'fr' ? 'Parlez-nous de vous...' : 'Tell us about yourself...'}
                />
              </div>

              <div className="mt-6">
                <button
                  onClick={handleProfileSave}
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Sauvegarder' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Changement de mot de passe */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Changer le mot de passe' : 'Change Password'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Mot de passe actuel' : 'Current Password'}
                  </label>
                  <div className="relative">
                                         <input
                       type={showPassword ? 'text' : 'password'}
                       name="currentPassword"
                       value={passwordData.currentPassword}
                       onChange={handlePasswordInputChange}
                       className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                     />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Nouveau mot de passe' : 'New Password'}
                  </label>
                  <div className="relative">
                                         <input
                       type={showNewPassword ? 'text' : 'password'}
                       name="newPassword"
                       value={passwordData.newPassword}
                       onChange={handlePasswordInputChange}
                       className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                     />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Confirmer le nouveau mot de passe' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                                         <input
                       type={showConfirmPassword ? 'text' : 'password'}
                       name="confirmPassword"
                       value={passwordData.confirmPassword}
                       onChange={handlePasswordInputChange}
                       className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                     />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Changer le mot de passe' : 'Change Password'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Statistiques générales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card text-center">
                <div className="p-4">
                  <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.totalTrips}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'fr' ? 'Sorties' : 'Trips'}
                  </p>
                </div>
              </div>

              <div className="card text-center">
                <div className="p-4">
                  <Fish className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.totalCatches}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'fr' ? 'Prises' : 'Catches'}
                  </p>
                </div>
              </div>

              <div className="card text-center">
                <div className="p-4">
                  <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.level}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'fr' ? 'Niveau' : 'Level'}
                  </p>
                </div>
              </div>

              <div className="card text-center">
                <div className="p-4">
                  <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.badges.length}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'fr' ? 'Badges' : 'Badges'}
                  </p>
                </div>
              </div>
            </div>

            {/* Progression du niveau */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Progression du niveau' : 'Level Progress'}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language === 'fr' ? 'Niveau' : 'Level'} {userStats.level}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {userStats.experience} / {userStats.level * 1000} XP
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getLevelProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Badges et réalisations */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Badges et réalisations' : 'Badges & Achievements'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userStats.badges.map((badge, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {badge.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {badge.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Plan actuel */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Plan actuel' : 'Current Plan'}
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {user?.plan || 'Gratuit'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Plan actif' : 'Active plan'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Prochain renouvellement' : 'Next renewal'}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {user?.nextBillingDate || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Changer de plan */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Changer de plan' : 'Change Plan'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div 
                    key={plan.id} 
                    className={`p-6 rounded-lg border-2 ${
                      user?.plan === plan.slug 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </h4>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.price} {plan.currency}/{plan.billing_cycle}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {plan.description}
                      </p>
                      <button
                        onClick={() => handlePlanChange(plan.slug)}
                        disabled={user?.plan === plan.slug}
                        className={`w-full px-4 py-2 rounded-lg font-medium ${
                          user?.plan === plan.slug
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {user?.plan === plan.slug 
                          ? (language === 'fr' ? 'Plan actuel' : 'Current Plan')
                          : (language === 'fr' ? 'Choisir ce plan' : 'Choose Plan')
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'fr' ? 'Paramètres de confidentialité' : 'Privacy Settings'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {language === 'fr' ? 'Profil visible' : 'Profile Visible'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Permettre aux autres utilisateurs de voir votre profil'
                          : 'Allow other users to see your profile'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange('profileVisible')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.profileVisible ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.profileVisible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Share2 className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {language === 'fr' ? 'Partager les données de pêche' : 'Share Fishing Data'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Partager vos données de pêche avec la communauté et les scientifiques'
                          : 'Share your fishing data with the community and scientists'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange('shareFishingData')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.shareFishingData ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.shareFishingData ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {language === 'fr' ? 'Afficher la localisation' : 'Show Location'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Afficher votre localisation dans les posts'
                          : 'Show your location in posts'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange('showLocation')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.showLocation ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.showLocation ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {language === 'fr' ? 'Autoriser les messages' : 'Allow Messages'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Permettre aux autres utilisateurs de vous envoyer des messages'
                          : 'Allow other users to send you messages'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange('allowMessages')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.allowMessages ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.allowMessages ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {language === 'fr' ? 'Notifications par email' : 'Email Notifications'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Recevoir des notifications par email'
                          : 'Receive email notifications'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handlePrivacySave}
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Sauvegarder les paramètres' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 