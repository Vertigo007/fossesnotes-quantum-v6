const { Sequelize } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL || 'sqlite:./database/fossesnotes.db';

async function checkDatabase() {
  const sequelize = new Sequelize(DATABASE_URL, {
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Get all table names
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables in database:');
    tables.forEach(table => console.log(`  - ${table}`));

    // Check if rivieres table exists
    if (tables.includes('rivieres')) {
      console.log('\n📊 Rivieres table structure:');
      const tableInfo = await sequelize.getQueryInterface().describeTable('rivieres');
      Object.keys(tableInfo).forEach(column => {
        console.log(`  - ${column}: ${tableInfo[column].type}`);
      });
    } else {
      console.log('\n❌ Rivieres table not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();



