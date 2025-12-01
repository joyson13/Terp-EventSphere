const { query, getClient } = require('./config');

/**
 * Run database migrations
 */
async function runMigrations() {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Check if migrations table exists
    const migrationTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    if (!migrationTableCheck.rows[0].exists) {
      // Create migrations table
      await client.query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // Read and execute init.sql schema
    // Note: In production, you'd want to read actual migration files
    // For now, we'll assume the schema is created via docker-compose init.sql
    
    await client.query('COMMIT');
    console.log('Migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  runMigrations,
};

