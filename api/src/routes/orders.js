import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function getCartItems(userId) {
  const cart = db.prepare(`SELECT * FROM carts WHERE user_id = ?`).get(userId);
  if (!cart) return { cartId: null, items: [] };
  const items = db
    .prepare(
      `SELECT ci.*, p.name, p.price_cents, v.price_delta_cents
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN variants v ON v.id = ci.variant_id
       WHERE ci.cart_id = ?`
    )
    .all(cart.id);
  return { cartId: cart.id, items };
}

function serializeOrder(order) {
  if (!order) return null;
  const items = db
    .prepare(
      `SELECT oi.*, p.name, v.name AS variant_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN variants v ON v.id = oi.variant_id
       WHERE oi.order_id = ?`
    )
    .all(order.id);
  const payment = db.prepare(`SELECT * FROM payments WHERE order_id = ?`).get(order.id);
  const refunds = db.prepare(`SELECT * FROM refunds WHERE order_id = ?`).all(order.id);
  return { ...order, items, payment, refunds };
}

router.get('/', (req, res) => {
  const orders = db
    .prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`)
    .all(req.session.user.id)
    .map(serializeOrder);
  res.json({ orders });
});

router.get('/:id', (req, res) => {
  const order = db
    .prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ?`)
    .get(Number(req.params.id), req.session.user.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ order: serializeOrder(order) });
});

router.post('/', (req, res) => {
  const { cartId, items } = getCartItems(req.session.user.id);
  if (!items.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }
  const total = items.reduce((sum, item) => sum + (item.price_cents + (item.price_delta_cents || 0)) * item.qty, 0);

  const result = db
    .prepare(`INSERT INTO orders (user_id, status, total_cents) VALUES (?, 'pending', ?)`)
    .run(req.session.user.id, total);
  const orderId = result.lastInsertRowid;

  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, variant_id, qty, price_cents_snapshot) VALUES (?, ?, ?, ?, ?)`
  );
  items.forEach((item) => {
    insertItem.run(
      orderId,
      item.product_id,
      item.variant_id,
      item.qty,
      (item.price_cents + (item.price_delta_cents || 0)) * item.qty
    );
  });

  if (cartId) {
    db.prepare(`DELETE FROM cart_items WHERE cart_id = ?`).run(cartId);
  }

  db.prepare(`INSERT INTO payments (order_id, status, card_last4, txn_ref) VALUES (?, 'pending', NULL, NULL)`).run(
    orderId
  );

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  res.status(201).json({ order: serializeOrder(order) });
});

router.post('/:id/refund', (req, res) => {
  const orderId = Number(req.params.id);
  const order = db
    .prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ?`)
    .get(orderId, req.session.user.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  db.prepare(`INSERT INTO refunds (order_id, amount_cents, reason) VALUES (?, ?, ?)`)
    .run(orderId, order.total_cents, req.body?.reason || 'Chatbot initiated refund');
  db.prepare(`UPDATE orders SET status = 'refunded' WHERE id = ?`).run(orderId);
  db.prepare(`UPDATE payments SET status = 'refunded' WHERE order_id = ?`).run(orderId);

  const updated = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  res.json({ order: serializeOrder(updated) });
});

router.post('/:id/cancel', (req, res) => {
  const orderId = Number(req.params.id);
  const order = db
    .prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ?`)
    .get(orderId, req.session.user.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status === 'completed') {
    return res.status(400).json({ error: 'Order already completed' });
  }

  db.prepare(`UPDATE orders SET status = 'cancelled' WHERE id = ?`).run(orderId);
  const updated = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  res.json({ order: serializeOrder(updated) });
});

export default router;
