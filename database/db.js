import pg from 'pg';
const { Pool } = pg;

// Next.js automatically loads .env files
// Ensure DATABASE_URL is available
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set!');
  throw new Error('DATABASE_URL is required');
}

// PostgreSQL connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database (NeonDB)');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const db = {
  query: (text, params) => pool.query(text, params),
  pool,
};

export default db;
