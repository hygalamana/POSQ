import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from '../db/schema';
import { initDatabase } from '../db/initDb';

function getDatabasePath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), 'prisma/dev.db'),
    path.resolve(process.cwd(), 'backend/prisma/dev.db'),
    path.resolve(__dirname, '../../prisma/dev.db'),
    path.resolve(__dirname, '../../../prisma/dev.db'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.resolve(__dirname, '../../prisma/dev.db');
}

export const dbPath = getDatabasePath();

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqlite = new Database(dbPath);

// Enable WAL mode for high performance & concurrent read/write
sqlite.pragma('journal_mode = WAL');

// Ensure all tables & indexes are initialized
initDatabase(sqlite);

export const db = drizzle(sqlite, { schema });
export default db;
export * from '../db/schema';
