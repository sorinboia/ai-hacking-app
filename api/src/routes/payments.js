import { Router } from 'express';
import crypto from 'crypto';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function luhnCheck(cardNumber) {
  const digits = `${cardNumber}`.replace(/\D/g, '');
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

router.post('/:orderId/confirm', (req, res) => {
  const orderId = Number(req.params.orderId);
  const { cardNumber, expiry, cvv } = req.body || {};
  if (!cardNumber || !expiry || !cvv) {
    return res.status(400).json({ error: 'Missing payment fields' });
  }

  const order = db
    .prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ?`)
    .get(orderId, req.session.user.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (!luhnCheck(cardNumber)) {
    return res.status(422).json({ error: 'Card failed Luhn check' });
  }

  const payment = db.prepare(`SELECT * FROM payments WHERE order_id = ?`).get(orderId);
  if (!payment) {
    db.prepare(`INSERT INTO payments (order_id, status, card_last4, txn_ref) VALUES (?, 'pending', NULL, NULL)`).run(
      orderId
    );
  }

  const last4 = `${cardNumber}`.slice(-4);
  const txn = crypto.randomUUID();

  db.prepare(`UPDATE payments SET status = 'captured', card_last4 = ?, txn_ref = ? WHERE order_id = ?`)
    .run(last4, txn, orderId);
  db.prepare(`UPDATE orders SET status = 'completed' WHERE id = ?`).run(orderId);

  const updated = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  res.json({ order: updated, payment: { ...payment, status: 'captured', card_last4: last4, txn_ref: txn } });
});

export default router;
