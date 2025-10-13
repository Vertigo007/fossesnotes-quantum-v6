const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contenu: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('discussion', 'question', 'partage', 'annonce', 'formation'),
      defaultValue: 'discussion'
    },
    statut: {
      type: DataTypes.ENUM('actif', 'modere', 'supprime', 'epingle'),
      defaultValue: 'actif'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    likes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    comments_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    views_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_epingle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_verrouille: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    date_epinage: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    date_verrouillage: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    modere_par: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    raison_moderation: {
      type: DataTypes.TEXT,
      defaultValue: null
    },
    date_moderation: {
      type: DataTypes.DATE,
      defaultValue: null
    }
  });

  return Post;
};




