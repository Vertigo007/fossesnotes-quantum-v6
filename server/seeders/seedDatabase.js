const mockData = require('./mockData');
const bcrypt = require('bcryptjs');

async function seedDatabase(sequelize) {
  console.log('🌱 Début du peuplement de la base de données...');

  try {
    // Récupérer les modèles
    const User = require('../models/User')(sequelize);
    const Badge = require('../models/Badge')(sequelize);
    const Category = require('../models/Category')(sequelize);
    const Post = require('../models/Post')(sequelize);
    const Comment = require('../models/Comment')(sequelize);
    const Course = require('../models/Course')(sequelize);
    const Club = require('../models/Club')(sequelize);

    // Synchroniser les modèles
    await sequelize.sync({ force: true });
    console.log('✅ Modèles synchronisés');

    // 1. Créer les badges
    console.log('🏆 Création des badges...');
    for (const badgeData of mockData.badges) {
      await Badge.create(badgeData);
    }
    console.log(`✅ ${mockData.badges.length} badges créés`);

    // 2. Créer les utilisateurs
    console.log('👥 Création des utilisateurs...');
    const createdUsers = [];
    for (const userData of mockData.users) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }
    console.log(`✅ ${mockData.users.length} utilisateurs créés`);

    // 3. Créer les catégories
    console.log('📂 Création des catégories...');
    for (const categoryData of mockData.categories) {
      await Category.create(categoryData);
    }
    console.log(`✅ ${mockData.categories.length} catégories créées`);

    // 4. Créer les posts
    console.log('📝 Création des posts...');
    for (const postData of mockData.posts) {
      await Post.create(postData);
    }
    console.log(`✅ ${mockData.posts.length} posts créés`);

    // 5. Créer les commentaires
    console.log('💬 Création des commentaires...');
    for (const commentData of mockData.comments) {
      await Comment.create(commentData);
    }
    console.log(`✅ ${mockData.comments.length} commentaires créés`);

    // 6. Créer les formations
    console.log('📚 Création des formations...');
    for (const courseData of mockData.courses) {
      await Course.create(courseData);
    }
    console.log(`✅ ${mockData.courses.length} formations créées`);

    // 7. Créer les clubs
    console.log('🏢 Création des clubs...');
    for (const clubData of mockData.clubs) {
      await Club.create(clubData);
    }
    console.log(`✅ ${mockData.clubs.length} clubs créés`);

    // 8. Mettre à jour les statistiques des catégories
    console.log('📊 Mise à jour des statistiques...');
    const categories = await Category.findAll();
    for (const category of categories) {
      const postsCount = await Post.count({ where: { category_id: category.id } });
      const commentsCount = await Comment.count({
        include: [{
          model: Post,
          where: { category_id: category.id }
        }]
      });
      
      await category.update({
        statistiques: {
          posts_count: postsCount,
          comments_count: commentsCount,
          last_activity: new Date()
        }
      });
    }

    console.log('🎉 Base de données peuplée avec succès !');
    console.log('\n📋 RÉSUMÉ :');
    console.log(`- ${mockData.badges.length} badges`);
    console.log(`- ${mockData.users.length} utilisateurs`);
    console.log(`- ${mockData.categories.length} catégories`);
    console.log(`- ${mockData.posts.length} posts`);
    console.log(`- ${mockData.comments.length} commentaires`);
    console.log(`- ${mockData.courses.length} formations`);
    console.log(`- ${mockData.clubs.length} clubs`);

    console.log('\n🔑 COMPTES DE TEST :');
    console.log('Admin: admin@fossesnotes.test / admin123');
    console.log('Elite: elite@fossesnotes.test / elite123');
    console.log('Instructor: instructor@fossesnotes.test / instructor123');
    console.log('Moderator: moderator@fossesnotes.test / moderator123');
    console.log('User1: user1@fossesnotes.test / user123');
    console.log('User2: user2@fossesnotes.test / user123');
    console.log('Club Admin: club_admin@fossesnotes.test / club123');

  } catch (error) {
    console.error('❌ Erreur lors du peuplement de la base de données:', error);
    throw error;
  }
}

module.exports = seedDatabase;




