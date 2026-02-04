import sqlite3 from "sqlite3";
import { open } from "sqlite";

let db = null;

export default async function getDb() {
  if (db) return db;

  db = await open({
    filename: "./tasks.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `);

  return db;
}
