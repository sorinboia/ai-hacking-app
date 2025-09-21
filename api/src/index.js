import express from 'express';
import session from 'express-session';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { PORT, SESSION_SECRET, FILE_ROOT, NODE_ENV } from './config.js';
import runMigrations from './db/migrate.js';
import { seedDatabase } from './db/seedData.js';
import { attachUser } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import ordersRoutes from './routes/orders.js';
import paymentsRoutes from './routes/payments.js';
import profileRoutes from './routes/profile.js';
import ragRoutes from './routes/rag.js';
import chatRoutes from './routes/chat.js';
import mcpRoutes from './routes/mcp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fs.mkdirSync(FILE_ROOT, { recursive: true });

runMigrations();
seedDatabase();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false,
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
    },
  })
);

app.use(attachUser);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/mcp', mcpRoutes);

app.use((err, req, res, next) => {
  console.error('API error', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error', details: err.details || null });
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
