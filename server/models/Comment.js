const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contenu: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    parent_id: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    likes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    statut: {
      type: DataTypes.ENUM('actif', 'modere', 'supprime'),
      defaultValue: 'actif'
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

  return Comment;
};




