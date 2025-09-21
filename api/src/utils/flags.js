import db from '../db/connection.js';
import { generateFlag } from '../db/seedData.js';

export function awardFlag(userId, vulnCode) {
  if (!userId) return null;
  const existing = db
    .prepare(`SELECT flag FROM flags_awarded WHERE user_id = ? AND vuln_code = ?`)
    .get(userId, vulnCode);

  if (existing?.flag) {
    return existing.flag;
  }

  const flag = generateFlag(vulnCode);
  db.prepare(`INSERT OR IGNORE INTO flags_awarded (user_id, vuln_code, flag) VALUES (?, ?, ?)`)
    .run(userId, vulnCode, flag);
  return flag;
}

export function listFlagsForUser(userId) {
  if (!userId) return [];
  return db
    .prepare(`SELECT vuln_code, flag, created_at FROM flags_awarded WHERE user_id = ? ORDER BY created_at ASC`)
    .all(userId);
}
