const sequelize = require('../server/config/database');
const User = require('../server/models/User')(sequelize);

const testAccounts = [
  {
    email: 'admin@fossesnotes.test',
    password: 'admin123',
    nom: 'Admin',
    prenom: 'Super',
    username: 'superadmin',
    role: 'super_admin',
    subscription_type: 'elite',
    is_active: true,
    is_verified: true
  },
  {
    email: 'elite@fossesnotes.test',
    password: 'elite123',
    nom: 'Elite',
    prenom: 'User',
    username: 'eliteuser',
    role: 'elite',
    subscription_type: 'elite',
    is_active: true,
    is_verified: true
  },
  {
    email: 'instructor@fossesnotes.test',
    password: 'instructor123',
    nom: 'Instructor',
    prenom: 'Pro',
    username: 'instructorpro',
    role: 'instructor',
    subscription_type: 'pro',
    is_active: true,
    is_verified: true
  },
  {
    email: 'moderator@fossesnotes.test',
    password: 'moderator123',
    nom: 'Moderator',
    prenom: 'Team',
    username: 'moderatorteam',
    role: 'moderator',
    subscription_type: 'pro',
    is_active: true,
    is_verified: true
  },
  {
    email: 'user1@fossesnotes.test',
    password: 'user123',
    nom: 'User',
    prenom: 'Basic',
    username: 'userbasic',
    role: 'user',
    subscription_type: 'basic',
    is_active: true,
    is_verified: true
  },
  {
    email: 'user2@fossesnotes.test',
    password: 'user123',
    nom: 'User',
    prenom: 'Free',
    username: 'userfree',
    role: 'user',
    subscription_type: 'free',
    is_active: true,
    is_verified: true
  },
  {
    email: 'club_admin@fossesnotes.test',
    password: 'club123',
    nom: 'Club',
    prenom: 'Admin',
    username: 'clubadmin',
    role: 'club_admin',
    subscription_type: 'pro',
    is_active: true,
    is_verified: true
  }
];

async function createTestAccounts() {
  try {
    console.log('🚀 Création des comptes de test...');

    for (const accountData of testAccounts) {
      // Vérifier si le compte existe déjà
      const existingUser = await User.findOne({
        where: { email: accountData.email }
      });

      if (!existingUser) {
        await User.create(accountData);
        console.log(`✅ Compte créé: ${accountData.email} (${accountData.role})`);
      } else {
        console.log(`⚠️ Compte déjà existant: ${accountData.email}`);
      }
    }

    // Compter le total des utilisateurs
    const totalUsers = await User.count();
    console.log(`\n📊 Total des utilisateurs dans la base: ${totalUsers}`);

    // Statistiques par rôle
    const stats = await User.findAll({
      attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['role']
    });

    console.log('\n📈 Statistiques par rôle:');
    stats.forEach(stat => {
      console.log(`   - ${stat.role}: ${stat.dataValues.count}`);
    });

    console.log('\n🎉 Création des comptes de test terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la création des comptes de test:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
createTestAccounts();



