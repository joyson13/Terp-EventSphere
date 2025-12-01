const { Pool } = require('pg');

let pool = null;

/**
 * Initialize database connection pool
 * @param {Object} config - Database configuration
 */
function initDatabase(config) {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: config.host || process.env.DB_HOST || 'localhost',
    port: config.port || process.env.DB_PORT || 5432,
    database: config.database || process.env.DB_NAME || 'eventsphere',
    user: config.user || process.env.DB_USER || 'eventsphere',
    password: config.password || process.env.DB_PASSWORD || 'eventsphere123',
    max: config.max || 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

/**
 * Get the database pool instance
 * @returns {Pool} Database pool
 */
function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.');
  }
  return pool;
}

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error: error.message });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Client>} Database client
 */
async function getClient() {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Close the database pool
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  initDatabase,
  getPool,
  query,
  getClient,
  closePool,
};

