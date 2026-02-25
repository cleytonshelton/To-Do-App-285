import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

let sqlite = null;

export function getSqliteDB() {
  if (sqlite) return sqlite;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbPath = path.join(__dirname, "..", "local.db");

  sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");

  return sqlite;
}
