import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function getOrCreateCart(userId) {
  let cart = db.prepare(`SELECT * FROM carts WHERE user_id = ?`).get(userId);
  if (!cart) {
    const result = db.prepare(`INSERT INTO carts (user_id) VALUES (?)`).run(userId);
    cart = { id: result.lastInsertRowid, user_id: userId };
  }
  return cart;
}

router.get('/', (req, res) => {
  const cart = getOrCreateCart(req.session.user.id);
  const items = db
    .prepare(
      `SELECT ci.*, p.name, p.description, p.price_cents, p.sku AS product_sku,
              v.name AS variant_name, v.price_delta_cents, v.sku_variant
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN variants v ON v.id = ci.variant_id
       WHERE ci.cart_id = ?`
    )
    .all(cart.id);

  res.json({ cart: { id: cart.id, items } });
});

router.post('/items', (req, res) => {
  const { productId, variantId = null, qty = 1 } = req.body || {};
  if (!productId) {
    return res.status(400).json({ error: 'productId required' });
  }
  const cart = getOrCreateCart(req.session.user.id);
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  let priceSnapshot = product.price_cents;
  if (variantId) {
    const variant = db.prepare(`SELECT * FROM variants WHERE id = ?`).get(variantId);
    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    priceSnapshot += variant.price_delta_cents || 0;
  }

  const result = db
    .prepare(
      `INSERT INTO cart_items (cart_id, product_id, variant_id, qty, price_cents_snapshot) VALUES (?, ?, ?, ?, ?)`
    )
    .run(cart.id, productId, variantId, qty, priceSnapshot * qty);

  const inserted = db.prepare(`SELECT * FROM cart_items WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json({ item: inserted });
});

router.delete('/items/:id', (req, res) => {
  const itemId = Number(req.params.id);
  const cart = getOrCreateCart(req.session.user.id);
  const item = db.prepare(`SELECT * FROM cart_items WHERE id = ? AND cart_id = ?`).get(itemId, cart.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  db.prepare(`DELETE FROM cart_items WHERE id = ?`).run(itemId);
  res.json({ ok: true });
});

export default router;
