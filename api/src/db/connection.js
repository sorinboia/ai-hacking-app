import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { DATABASE_URL } from '../config.js';

fs.mkdirSync(path.dirname(DATABASE_URL), { recursive: true });

const db = new Database(DATABASE_URL);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec('PRAGMA busy_timeout = 5000');

export default db;
