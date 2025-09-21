import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.session.user.id);
  const address = db.prepare(`SELECT * FROM addresses WHERE user_id = ?`).get(req.session.user.id);
  res.json({
    profile: {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      address,
    },
  });
});

router.put('/address', (req, res) => {
  const { line1, line2 = '', city, state, postal_code, country = 'USA' } = req.body || {};
  if (!line1 || !city || !state || !postal_code) {
    return res.status(400).json({ error: 'Missing required address fields' });
  }

  const existing = db.prepare(`SELECT * FROM addresses WHERE user_id = ?`).get(req.session.user.id);
  if (existing) {
    db.prepare(
      `UPDATE addresses SET line1 = ?, line2 = ?, city = ?, state = ?, postal_code = ?, country = ? WHERE user_id = ?`
    ).run(line1, line2, city, state, postal_code, country, req.session.user.id);
  } else {
    db.prepare(
      `INSERT INTO addresses (user_id, line1, line2, city, state, postal_code, country) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(req.session.user.id, line1, line2, city, state, postal_code, country);
  }

  const address = db.prepare(`SELECT * FROM addresses WHERE user_id = ?`).get(req.session.user.id);
  res.json({ address });
});

router.put('/password', (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing password fields' });
  }
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.session.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(403).json({ error: 'Current password incorrect' });
  }
  const password_hash = bcrypt.hashSync(newPassword, 10);
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(password_hash, req.session.user.id);
  res.json({ ok: true });
});

export default router;
