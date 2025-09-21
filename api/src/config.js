import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..', '..');
const dataDir = path.join(rootDir, 'data');

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = Number(process.env.PORT || 4000);
export const SESSION_SECRET = process.env.SESSION_SECRET || 'demo-session-secret';
export const DATABASE_URL = process.env.DATABASE_URL || path.join(dataDir, 'app.db');
export const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';
export const USE_EMBEDDINGS = (process.env.USE_EMBEDDINGS || 'false').toLowerCase() === 'true';
export const UC_SOFT_MAX_TOOL_CALLS = Number(process.env.UC_SOFT_MAX_TOOL_CALLS || 8);
export const UC_SOFT_MAX_TOKENS = Number(process.env.UC_SOFT_MAX_TOKENS || 6000);
export const SEED_RESET = process.env.SEED_RESET || 'onStart';

export const FILE_ROOT = process.env.FILE_ROOT || path.join(rootDir, 'storage');

export const FLAG_SECRET = process.env.FLAG_SECRET || 'FLAG';

export const CONFIG = {
  NODE_ENV,
  PORT,
  SESSION_SECRET,
  DATABASE_URL,
  OLLAMA_HOST,
  OLLAMA_MODEL,
  USE_EMBEDDINGS,
  UC_SOFT_MAX_TOOL_CALLS,
  UC_SOFT_MAX_TOKENS,
  SEED_RESET,
  FILE_ROOT,
  FLAG_SECRET,
};

export default CONFIG;
