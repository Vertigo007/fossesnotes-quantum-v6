const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Club = sequelize.define('Club', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('club_peche', 'organisme', 'association', 'entreprise'),
      defaultValue: 'club_peche'
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    logo: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    banniere: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    couleur_principale: {
      type: DataTypes.STRING,
      defaultValue: '#3B82F6'
    },
    couleur_secondaire: {
      type: DataTypes.STRING,
      defaultValue: '#10B981'
    },
    localisation: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    site_web: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    email_contact: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    telephone: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    reseaux_sociaux: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    statut: {
      type: DataTypes.ENUM('actif', 'suspendu', 'supprime'),
      defaultValue: 'actif'
    },
    abonnement_type: {
      type: DataTypes.ENUM('gratuit', 'basique', 'premium'),
      defaultValue: 'gratuit'
    },
    abonnement_expire: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    membres_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    posts_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    evenements_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    date_derniere_activite: {
      type: DataTypes.DATE,
      defaultValue: null
    }
  });

  return Club;
};




