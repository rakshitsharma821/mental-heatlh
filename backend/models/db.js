// ============================================
// MindCare Sanctuary — PostgreSQL Database Adapter
// Provides unified pool and query helpers for all controllers
// ============================================

import { pool, initPostgresDatabase, cleanTestDatabase, resolveDatabaseName, activeDbName } from './pgDb.js';

export const db = {
  /**
   * Execute a parameterized SQL query on the PostgreSQL connection pool.
   * Example: await db.query('SELECT * FROM users WHERE email = $1', [email]);
   */
  query: async (text, params) => {
    return pool.query(text, params);
  },

  getClient: async () => {
    return pool.connect();
  },

  end: async () => {
    return pool.end();
  }
};

export { pool, initPostgresDatabase, cleanTestDatabase, resolveDatabaseName, activeDbName };
