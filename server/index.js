// Charger l'environnement avant tout
require('./utils/loadEnv');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rivieres', require('./routes/rivieres'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/paypal', require('./routes/paypal'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/secure', require('./routes/secure'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/posts', require('./routes/posts'));

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '6.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: '🎣 FossesNotes QUANTUM v6.0 API',
    version: '6.0.0',
    status: 'Operational',
    endpoints: {
      auth: '/api/auth',
      rivieres: '/api/rivieres',
      users: '/api/users',
      journal: '/api/journal',
      posts: '/api/posts',
      admin: '/api/admin',
      paypal: '/api/paypal',
      routes: '/api/routes',
      classroom: '/api/classroom',
      events: '/api/events',
      community: '/api/community',
      logs: '/api/logs',
      profile: '/api/profile',
      adminReports: '/api/admin/reports'
    }
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 FossesNotes QUANTUM v6.0 API démarrée sur le port ${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 