const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
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
    description_courte: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('gratuit', 'payant'),
      defaultValue: 'gratuit'
    },
    prix: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    devise: {
      type: DataTypes.STRING,
      defaultValue: 'CAD'
    },
    instructeur_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    niveau: {
      type: DataTypes.ENUM('debutant', 'intermediaire', 'avance', 'expert'),
      defaultValue: 'debutant'
    },
    duree: {
      type: DataTypes.INTEGER, // en minutes
      defaultValue: 0
    },
    modules_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lecons_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    image_principale: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    video_intro: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    prerequis: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    objectifs: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    materiel_requis: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    statut: {
      type: DataTypes.ENUM('brouillon', 'publie', 'archive'),
      defaultValue: 'brouillon'
    },
    est_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    est_populaire: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    note_moyenne: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00
    },
    evaluations_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    inscriptions_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    date_publication: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    date_derniere_modification: {
      type: DataTypes.DATE,
      defaultValue: null
    }
  });

  return Course;
};




