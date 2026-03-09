/**
 * SQLite Adapter for ORDB
 *
 * Implements the ORDB interface for SQLite database operations.
 * Converts callback-based SQLite3 API to Promise-based ORDB interface.
 */

import sqlite3 from 'sqlite3';
import { ORDB } from './ordb.js';

const { Database } = sqlite3.verbose();

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Builds a WHERE clause and its bound values from a filter object. */
function buildWhere(filter = {}) {
  const entries = Object.entries(filter);
  if (entries.length === 0) return { clause: '', values: [] };
  const clause = 'WHERE ' + entries.map(([k]) => `${k} = ?`).join(' AND ');
  const values = entries.map(([, v]) => v);
  return { clause, values };
}

/** Serializes a value for SQLite storage (JSON-encodes objects/arrays). */
function serialize(value) {
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
}

/** Deserializes a row returned from SQLite, parsing any JSON columns. */
function deserializeRow(row) {
  if (!row) return null;
  const result = { ...row };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      try { result[key] = JSON.parse(value); } catch { /* not JSON, leave as-is */ }
    }
  }
  return result;
}

// ── Adapter ────────────────────────────────────────────────────────────────────

export class SQLiteAdapter extends ORDB {
  constructor(dbPath) {
    super();
    this.dbPath = dbPath;
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new Database(this.dbPath, (err) => {
        if (err) {
          console.error('Failed to open SQLite database:', err.message);
          return reject(err);
        }
        console.log('SQLite connected');
        this._initializeDatabase().then(resolve).catch(reject);
      });
    });
  }

  async _initializeDatabase() {
    return new Promise((resolve, reject) => {
      const sql = `
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS tasks (
          _id        INTEGER PRIMARY KEY AUTOINCREMENT,
          title      TEXT    NOT NULL,
          date       TEXT,
          status     TEXT    DEFAULT 'Pending',
          priority   INTEGER DEFAULT 3,
          subtasks   TEXT    DEFAULT '[]',
          createdAt  TEXT    DEFAULT (datetime('now'))
        );
      `;
      this.db.exec(sql, (err) => {
        if (err) {
          console.error('Failed to initialize database:', err.message);
          return reject(err);
        }
        console.log('SQLite database initialized');
        resolve();
      });
    });
  }

  async disconnect() {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          return reject(err);
        }
        console.log('SQLite disconnected');
        resolve();
      });
    });
  }

  async findAll(collection, filter = {}, options = {}) {
    return new Promise((resolve, reject) => {
      const { clause, values } = buildWhere(filter);
      let sql = `SELECT * FROM ${collection} ${clause}`.trim();

      if (options.sort) {
        const order = Object.entries(options.sort)
          .map(([k, dir]) => `${k} ${dir === -1 ? 'DESC' : 'ASC'}`)
          .join(', ');
        sql += ` ORDER BY ${order}`;
      }

      if (options.limit) sql += ` LIMIT ${options.limit}`;

      this.db.all(sql, values, (err, rows) => {
        if (err) return reject(err);
        resolve((rows || []).map(deserializeRow));
      });
    });
  }

  async findOne(collection, filter) {
    return new Promise((resolve, reject) => {
      const { clause, values } = buildWhere(filter);
      const sql = `SELECT * FROM ${collection} ${clause} LIMIT 1`.trim();

      this.db.get(sql, values, (err, row) => {
        if (err) return reject(err);
        resolve(deserializeRow(row));
      });
    });
  }

  async insertOne(collection, data) {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(data).filter(k => k !== '_id');
      const values = keys.map(k => serialize(data[k]));
      const placeholders = keys.map(() => '?').join(', ');
      const sql = `INSERT INTO ${collection} (${keys.join(', ')}) VALUES (${placeholders})`;

      this.db.run(sql, values, function (err) {
        if (err) return reject(err);
        resolve({ ...data, _id: this.lastID });
      });
    });
  }

  async updateOne(collection, filter, update) {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const setKeys    = Object.keys(update);
      const setValues  = setKeys.map(k => serialize(update[k]));
      const setClauses = setKeys.map(k => `${k} = ?`).join(', ');
      const { clause: whereClause, values: whereValues } = buildWhere(filter);

      const sql = `UPDATE ${collection} SET ${setClauses} ${whereClause}`.trim();

      db.run(sql, [...setValues, ...whereValues], function (err) {
        if (err) return reject(err);
        if (this.changes === 0) return resolve(null);

        db.get(
          `SELECT * FROM ${collection} ${whereClause}`.trim(),
          whereValues,
          (err2, row) => {
            if (err2) return reject(err2);
            resolve(deserializeRow(row));
          }
        );
      });
    });
  }

  async deleteOne(collection, filter) {
    return new Promise((resolve, reject) => {
      const { clause, values } = buildWhere(filter);
      const sql = `DELETE FROM ${collection} ${clause}`.trim();

      this.db.run(sql, values, function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  getType() {
    return 'SQLite';
  }
}

export default SQLiteAdapter;