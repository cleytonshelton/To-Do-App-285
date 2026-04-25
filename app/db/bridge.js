/**
 * Database Bridge
 * 
 * Selects and initializes the appropriate database adapter based on 
 * environment configuration. This allows easy switching between databases
 * without changing application code.
 * 
 * Usage:
 *   import { db } from './db/bridge.js';
 *   await db.connect();
 *   const tasks = await db.findAll('tasks');
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { MongooseAdapter } from './mongoDB_adapter.js';
import { SQLiteAdapter } from './sqlite_adapter.js';
import uri from './uri.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create and return the appropriate database adapter
 * based on environment configuration
 */
function createDatabaseAdapter() {
  const dbType = process.env.DB_TYPE || 'sqlite';

  console.log(`Initializing database adapter: ${dbType}`);

  switch (dbType.toLowerCase()) {
    case 'mongodb':
      return createMongooseAdapter();

    case 'sqlite':
      return createSQLiteAdapter();

    default:
      console.warn(`Unknown DB_TYPE: ${dbType}. Falling back to SQLite.`);
      return createSQLiteAdapter();
  }
}

/**
 * Create Mongoose adapter with configuration from environment
 */
function createMongooseAdapter() {
  const databaseName = process.env.MONGO_DATABASE || 'todoapp';
  return new MongooseAdapter(uri, databaseName);
}

/**
 * Create SQLite adapter with configuration from environment
 */
function createSQLiteAdapter() {
  const dbPath = process.env.SQLITE_PATH ||
                 path.join(__dirname, '..', 'todoapp.sqlite');

  return new SQLiteAdapter(dbPath);
}

// Create the database instance
const dbAdapter = createDatabaseAdapter();

/**
 * Ensures the database is connected before any operation
 */
let isConnected = false;

async function ensureConnected() {
  if (!isConnected) {
    await dbAdapter.connect();
    isConnected = true;
  }
}

/**
 * Export a wrapped database object that ensures connection
 * before every operation automatically.
 */
export const db = {
  connect: () => {
    isConnected = true;
    return dbAdapter.connect();
  },

  disconnect: () => {
    isConnected = false;
    return dbAdapter.disconnect();
  },

  findAll: async (...args) => {
    await ensureConnected();
    return dbAdapter.findAll(...args);
  },

  findOne: async (...args) => {
    await ensureConnected();
    return dbAdapter.findOne(...args);
  },

  insertOne: async (...args) => {
    await ensureConnected();
    return dbAdapter.insertOne(...args);
  },

  updateOne: async (...args) => {
    await ensureConnected();
    return dbAdapter.updateOne(...args);
  },

  // ─── ADDED THIS METHOD ───
  updateUserTheme: async (...args) => {
    await ensureConnected();
    return dbAdapter.updateUserTheme(...args);
  },

  deleteOne: async (...args) => {
    await ensureConnected();
    return dbAdapter.deleteOne(...args);
  },

  // Export the raw adapter for advanced usage
  adapter: dbAdapter,
};

export default db;