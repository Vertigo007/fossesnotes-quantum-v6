const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    prenom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin', 'club_admin'),
      defaultValue: 'user'
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    bio: {
      type: DataTypes.TEXT,
      defaultValue: null
    },
    localisation: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    experience_niveau: {
      type: DataTypes.ENUM('debutant', 'intermediaire', 'avance', 'expert'),
      defaultValue: 'debutant'
    },
    // Gamification
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    niveau: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    badges: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    // Statistiques
    posts_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    comments_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    likes_received: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Abonnement
    subscription_type: {
      type: DataTypes.ENUM('free', 'basic', 'pro', 'elite'),
      defaultValue: 'free'
    },
    subscription_expires: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    // Club (si applicable)
    club_id: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    // Statut
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_login: {
      type: DataTypes.DATE,
      defaultValue: null
    }
  }, {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // Méthodes d'instance
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.addPoints = function(points) {
    this.points += points;
    this.updateNiveau();
    return this.save();
  };

  User.prototype.updateNiveau = function() {
    const niveaux = [0, 100, 500, 1000, 2500, 5000, 10000];
    for (let i = niveaux.length - 1; i >= 0; i--) {
      if (this.points >= niveaux[i]) {
        this.niveau = i + 1;
        break;
      }
    }
  };

  User.prototype.addBadge = function(badgeId) {
    if (!this.badges.includes(badgeId)) {
      this.badges.push(badgeId);
      return this.save();
    }
  };

  User.prototype.hasPermission = function(permission) {
    const permissions = {
      'super_admin': ['all'],
      'content_admin': ['manage_content', 'moderate', 'manage_users'],
      'moderator': ['moderate', 'delete_posts'],
      'instructor': ['create_courses', 'manage_own_content'],
      'club_admin': ['manage_club', 'moderate_club'],
      'elite': ['access_premium', 'priority_support'],
      'user': ['basic_access']
    };

    const userPermissions = permissions[this.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  };

  return User;
};






