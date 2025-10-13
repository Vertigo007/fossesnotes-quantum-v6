const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Badge = sequelize.define('Badge', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false
    },
    couleur: {
      type: DataTypes.STRING,
      defaultValue: '#3B82F6'
    },
    categorie: {
      type: DataTypes.ENUM('progression', 'saisonnier', 'evenement', 'special'),
      defaultValue: 'progression'
    },
    points_requis: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    criteres: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    rarete: {
      type: DataTypes.ENUM('commune', 'rare', 'epique', 'legendaire'),
      defaultValue: 'commune'
    },
    est_actif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    date_debut: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    date_fin: {
      type: DataTypes.DATE,
      defaultValue: null
    }
  });

  return Badge;
};




