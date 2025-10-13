const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
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
    icon: {
      type: DataTypes.STRING,
      allowNull: false
    },
    couleur: {
      type: DataTypes.STRING,
      defaultValue: '#3B82F6'
    },
    parent_id: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    ordre: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    est_actif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    est_prive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    regles: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    permissions_poster: {
      type: DataTypes.JSON,
      defaultValue: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin']
    },
    permissions_lire: {
      type: DataTypes.JSON,
      defaultValue: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin']
    },
    moderateurs: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    statistiques: {
      type: DataTypes.JSON,
      defaultValue: {
        posts_count: 0,
        comments_count: 0,
        last_activity: null
      }
    }
  });

  return Category;
};




