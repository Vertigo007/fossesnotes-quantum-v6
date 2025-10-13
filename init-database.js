const sequelize = require('./server/config/database');
const User = require('./server/models/User')(sequelize);
const { seedPlans } = require('./server/seeders/planSeeder');
const { seedRivieres } = require('./server/seeders/rivieresSeeder');

async function initDatabase() {
  try {
    console.log('🚀 Initialisation de la base de données...');

    // Synchroniser les modèles
    await sequelize.sync({ force: true });
    console.log('✅ Modèles synchronisés');

    // Seeder les plans
    await seedPlans();
    console.log('✅ Plans d\'abonnement créés');

    // Seeder les rivières
    await seedRivieres();
    console.log('✅ Rivières à saumon créées');

    console.log('🎉 Base de données initialisée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur initialisation base de données:', error);
    process.exit(1);
  }
}

initDatabase();
