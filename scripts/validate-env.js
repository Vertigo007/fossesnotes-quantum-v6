const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('🔍 Validation de l\'environnement...');
console.log('📁 Répertoire courant:', process.cwd());
console.log('📁 Fichier .env:', path.join(__dirname, '..', '.env'));
console.log('🔧 JWT_SECRET:', process.env.JWT_SECRET ? 'Défini' : 'Non défini');
console.log('🔧 DW_SALT:', process.env.DW_SALT ? 'Défini' : 'Non défini');

// Variables critiques requises
const requiredVars = [
  'JWT_SECRET',
  'DW_SALT'
];

// Variables optionnelles avec valeurs par défaut
const optionalVars = {
  'NODE_ENV': 'development',
  'JWT_EXPIRATION': '1h',
  'JWT_REFRESH_EXPIRATION': '7d',
  'PORT': '5000',
  'CLIENT_PORT': '3000',
  'FRONTEND_URL': 'http://localhost:3000',
  'BACKEND_URL': 'http://localhost:5000',
  'PAYPAL_MODE': 'sandbox',
  'LOG_LEVEL': 'debug',
  'CORS_ORIGIN': 'http://localhost:3000',
  'RATE_LIMIT_WINDOW_MS': '900000',
  'RATE_LIMIT_MAX_REQUESTS': '100'
};

// Vérifier les variables critiques
let missingVars = [];
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('❌ Variables d\'environnement manquantes:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📝 Créez un fichier .env avec ces variables:');
  console.log('JWT_SECRET=your-super-secret-jwt-key-change-in-production');
  console.log('DW_SALT=your-dw-salt-change-in-production');
  process.exit(1);
}

// Afficher les variables configurées
console.log('✅ Variables critiques configurées:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const maskedValue = value.length > 8 ? value.substring(0, 8) + '...' : value;
  console.log(`   - ${varName}: ${maskedValue}`);
});

console.log('\n📋 Variables optionnelles:');
Object.entries(optionalVars).forEach(([varName, defaultValue]) => {
  const value = process.env[varName] || defaultValue;
  console.log(`   - ${varName}: ${value} ${!process.env[varName] ? '(défaut)' : ''}`);
});

// Vérifier les APIs externes
console.log('\n🌐 APIs externes:');
if (process.env.OPENWEATHER_API_KEY) {
  console.log('   - OpenWeatherMap: ✅ Configuré');
} else {
  console.log('   - OpenWeatherMap: ⚠️ Non configuré (Open-Meteo sera utilisé)');
}

if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  console.log('   - PayPal: ✅ Configuré');
} else {
  console.log('   - PayPal: ⚠️ Non configuré (mode sandbox)');
}

console.log('\n✅ Validation de l\'environnement terminée');
