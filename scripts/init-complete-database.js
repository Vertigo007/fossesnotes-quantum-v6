const sequelize = require('../server/config/database');
const User = require('../server/models/User')(sequelize);
const Plan = require('../server/models/Plan');
const Riviere = require('../server/models/Riviere')(sequelize);
const { seedPlans } = require('../server/seeders/planSeeder');
const { seedRivieres } = require('../server/seeders/rivieresSeeder');

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

async function initCompleteDatabase() {
  try {
    console.log('🚀 Initialisation complète de la base de données...');

    // Synchroniser tous les modèles
    await sequelize.sync({ force: true });
    console.log('✅ Modèles synchronisés');

    // Seeder les plans
    await seedPlans();
    console.log('✅ Plans d\'abonnement créés');

    // Seeder les rivières
    await seedRivieres();
    console.log('✅ Rivières à saumon créées');

    // Créer les comptes de test
    console.log('👥 Création des comptes de test...');
    for (const accountData of testAccounts) {
      await User.create(accountData);
      console.log(`✅ Compte créé: ${accountData.email} (${accountData.role})`);
    }

    // Statistiques finales
    const totalUsers = await User.count();
    const totalPlans = await Plan.count();
    const totalRivieres = await Riviere.count();

    console.log('\n📊 Statistiques finales:');
    console.log(`   - Utilisateurs: ${totalUsers}`);
    console.log(`   - Plans: ${totalPlans}`);
    console.log(`   - Rivières: ${totalRivieres}`);

    console.log('\n🎉 Base de données complètement initialisée !');
    console.log('\n🔑 Comptes de test disponibles:');
    testAccounts.forEach(account => {
      console.log(`   - ${account.email} / ${account.password} (${account.role})`);
    });

  } catch (error) {
    console.error('❌ Erreur initialisation base de données:', error);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
initCompleteDatabase();
