import Database from "better-sqlite3";

let db = null;

export default function getDb() {
  if (db) return db;

  db = new Database("tasks.db");

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `,
  ).run();

  return db;
}
