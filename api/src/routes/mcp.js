import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/register', (req, res) => {
  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: 'url required' });
  }

  db.prepare(`INSERT INTO mcp_endpoints (user_id, url) VALUES (?, ?)`)
    .run(req.session.user.id, url);

  res.json({ ok: true });
});

router.get('/endpoints', (req, res) => {
  const rows = db.prepare(`SELECT * FROM mcp_endpoints WHERE user_id = ?`).all(req.session.user.id);
  res.json({ endpoints: rows });
});

export default router;
