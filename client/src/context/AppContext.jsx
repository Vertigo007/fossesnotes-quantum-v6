import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { language, changeLanguage } = useLanguage();
  
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [appVersion] = useState('6.0.0');
  const [isPWA, setIsPWA] = useState(false);

  // Détecter si l'app est installée comme PWA
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = window.navigator.standalone === true;
      setIsPWA(isStandalone || isInApp);
    };

    checkPWA();
    window.addEventListener('appinstalled', checkPWA);
    return () => window.removeEventListener('appinstalled', checkPWA);
  }, []);

  // Gérer la connectivité
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Charger le thème depuis le localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('fossesnotes-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Détecter le thème système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Sauvegarder le thème
  useEffect(() => {
    localStorage.setItem('fossesnotes-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Gérer les notifications
  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Garder max 10 notifications

    // Auto-suppression après 5 secondes
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Gérer le thème
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Gérer la sidebar
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Fonctionnalités PWA
  const installPWA = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker enregistré:', registration);
        
        // Demander les permissions de notification
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          addNotification({
            type: 'success',
            title: 'PWA installée',
            message: 'L\'application est maintenant installée sur votre appareil'
          });
        }
      } catch (error) {
        console.error('Erreur installation PWA:', error);
        addNotification({
          type: 'error',
          title: 'Erreur installation',
          message: 'Impossible d\'installer l\'application'
        });
      }
    }
  };

  // Fonctionnalités de partage
  const shareContent = async (data) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (error) {
        console.error('Erreur partage:', error);
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API de partage
      const url = data.url || window.location.href;
      navigator.clipboard.writeText(url);
      addNotification({
        type: 'success',
        title: 'Lien copié',
        message: 'Le lien a été copié dans le presse-papiers'
      });
    }
  };

  // Fonctionnalités de vibration (mobile)
  const vibrate = (pattern = 100) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Fonctionnalités de géolocalisation
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  // Fonctionnalités de cache
  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        addNotification({
          type: 'success',
          title: 'Cache vidé',
          message: 'Le cache de l\'application a été vidé'
        });
      } catch (error) {
        console.error('Erreur vidage cache:', error);
      }
    }
  };

  // Statistiques d'utilisation
  const getUsageStats = () => {
    return {
      isOnline,
      isPWA,
      theme,
      language,
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      appVersion,
      timestamp: new Date().toISOString()
    };
  };

  const value = {
    // État
    theme,
    sidebarOpen,
    notifications,
    isOnline,
    isPWA,
    appVersion,
    
    // Actions
    toggleTheme,
    toggleSidebar,
    closeSidebar,
    addNotification,
    removeNotification,
    clearNotifications,
    installPWA,
    shareContent,
    vibrate,
    getLocation,
    clearCache,
    getUsageStats,
    
    // Utilitaires
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isDesktop: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 