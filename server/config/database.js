const { Sequelize } = require('sequelize');
const path = require('path');

// Configuration de la base de données SQLite
const dbPath = process.env.NODE_ENV === 'test' 
  ? path.join(__dirname, '../../test-database.sqlite')
  : path.join(__dirname, '../../fossesnotes.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Test de connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
  }
};

module.exports = sequelize;
module.exports.testConnection = testConnection;
