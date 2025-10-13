const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Riviere = sequelize.define('Riviere', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    nom_anglais: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    pays: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Canada'
    },
    province_etat: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('riviere', 'fleuve', 'ruisseau', 'creek', 'river'),
      allowNull: false,
      defaultValue: 'riviere'
    },
    classe: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '1=Elite, 2=Standard, 3=Débutant'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false
    },
    longueur_km: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false
    },
    bassin_versant_km2: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    nombre_fosses: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    nombre_secteurs: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    type_acces: {
      type: DataTypes.ENUM('routier', 'sentier', 'bateau', 'helicoptere', 'mixte'),
      defaultValue: null
    },
    difficulte_acces: {
      type: DataTypes.ENUM('facile', 'modere', 'difficile', 'tres_difficile'),
      defaultValue: null
    },
    saison_peche: {
      type: DataTypes.STRING(100),
      defaultValue: null
    },
    saison_principale: {
      type: DataTypes.STRING(50),
      defaultValue: null
    },
    temperature_eau: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: null
    },
    niveau_eau: {
      type: DataTypes.ENUM('tres_bas', 'bas', 'normal', 'eleve', 'tres_eleve'),
      defaultValue: null
    },
    niveau_eau_cm: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    debit_m3s: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: null
    },
    ph_eau: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: null
    },
    oxygene_mg_l: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: null
    },
    clarte: {
      type: DataTypes.ENUM('excellente', 'bonne', 'moyenne', 'faible'),
      defaultValue: null
    },
    statut_conditions: {
      type: DataTypes.ENUM('excellente', 'bonne', 'moyenne', 'difficile', 'fermee'),
      defaultValue: null
    },
    statut_conservation: {
      type: DataTypes.ENUM('excellent', 'bon', 'preoccupant', 'critique'),
      defaultValue: null
    },
    population_saumon: {
      type: DataTypes.ENUM('abondante', 'stable', 'declin', 'critique'),
      defaultValue: null
    },
    taille_moyenne_saumon: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      comment: 'Taille moyenne en cm'
    },
    record_saumon: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      comment: 'Record en livres'
    },
    mouches_recommandees: {
      type: DataTypes.JSON,
      defaultValue: null
    },
    techniques_recommandees: {
      type: DataTypes.JSON,
      defaultValue: null
    },
    reglementation: {
      type: DataTypes.TEXT,
      defaultValue: null
    },
    permis_requis: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    tirage_au_sort: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    date_limite_tirage: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    url_tirage: {
      type: DataTypes.STRING(500),
      defaultValue: null
    },
    camping_autorise: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    guides_disponibles: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lodges_proches: {
      type: DataTypes.JSON,
      defaultValue: null
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: null
    },
    historique: {
      type: DataTypes.TEXT,
      defaultValue: null
    },
    alerte_speciale: {
      type: DataTypes.TEXT,
      defaultValue: null
    },
    source_donnees: {
      type: DataTypes.STRING(255),
      defaultValue: null
    },
    donnees_verifiees: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    derniere_maj: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    notes_privilegees: {
      type: DataTypes.TEXT,
      defaultValue: null,
      comment: 'Notes pour les plans premium'
    }
  }, {
    tableName: 'rivieres',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Riviere;
};

