// Test veritabanı bağlantısını kontrol et
const { sequelize } = require('../src/models');

async function checkDatabase() {
    try {
        console.log('Testing database connection...');
        await sequelize.authenticate();
        console.log('✓ Database connection successful!');
        console.log(`Database: ${sequelize.config.database}`);
        console.log(`Host: ${sequelize.config.host}`);
        console.log(`Port: ${sequelize.config.port}`);

        // Test sync
        console.log('\nTesting database sync...');
        await sequelize.sync({ force: false });
        console.log('✓ Database sync successful!');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('✗ Database connection failed!');
        console.error('Error:', error.message);
        console.error('\nPlease check:');
        console.error('1. PostgreSQL is running');
        console.error('2. Test database exists (campus_db_test)');
        console.error('3. Database credentials are correct');
        process.exit(1);
    }
}

checkDatabase();
