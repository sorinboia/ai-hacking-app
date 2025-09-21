import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/connection.js';
import { listFlagsForUser } from '../utils/flags.js';

const router = Router();

function serializeUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.user = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    full_name: user.full_name,
  };

  const flags = listFlagsForUser(user.id);
  res.json({ user: req.session.user, flags });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.post('/register', (req, res) => {
  const { email, password, full_name, username } = req.body || {};
  if (!email || !password || !full_name || !username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const existing = db
    .prepare(`SELECT id FROM users WHERE email = ? OR username = ?`)
    .get(email.trim().toLowerCase(), username.trim());
  if (existing) {
    return res.status(409).json({ error: 'Email or username already in use' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare(
      `INSERT INTO users (role, full_name, username, email, password_hash) VALUES ('user', @full_name, @username, @email, @password_hash)`
    )
    .run({
      full_name,
      username,
      email: email.trim().toLowerCase(),
      password_hash,
    });

  const userId = result.lastInsertRowid;
  db.prepare(`INSERT INTO carts (user_id) VALUES (?)`).run(userId);

  req.session.user = {
    id: userId,
    email: email.trim().toLowerCase(),
    username,
    role: 'user',
    full_name,
  };

  res.status(201).json({ user: req.session.user, flags: [] });
});

router.get('/me', (req, res) => {
  if (!req.session?.user) {
    return res.json({ user: null, flags: [] });
  }

  const flags = listFlagsForUser(req.session.user.id);
  res.json({ user: req.session.user, flags });
});

export default router;
