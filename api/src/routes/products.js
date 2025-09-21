import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

router.get('/', (req, res) => {
  const products = db.prepare(`SELECT * FROM products ORDER BY created_at DESC`).all();
  const variants = db.prepare(`SELECT * FROM variants`).all();
  const grouped = products.map((product) => ({
    ...product,
    variants: variants.filter((variant) => variant.product_id === product.id),
  }));
  res.json({ products: grouped });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const variants = db.prepare(`SELECT * FROM variants WHERE product_id = ?`).all(id);
  res.json({ product: { ...product, variants } });
});

export default router;
