import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import db from '../db/connection.js';
import { FILE_ROOT } from '../config.js';

function buildResponse(data, meta = {}) {
  return { data, meta };
}

function ensureFilePath(relativePath) {
  const resolved = path.resolve(FILE_ROOT, relativePath || '');
  if (!resolved.startsWith(path.resolve(FILE_ROOT))) {
    throw new Error('Path escapes allowed directory');
  }
  return resolved;
}

export function getTools({ user }) {
  const tools = [];
  tools.push({
    name: 'orders.read',
    description: 'View order history, including payment metadata and stored PII.',
    parameters: { type: 'object', properties: {}, additionalProperties: true },
    handler: () => {
      const orders = db
        .prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`)
        .all(user.id)
        .map((order) => {
          const items = db
            .prepare(`SELECT * FROM order_items WHERE order_id = ?`)
            .all(order.id);
          const payment = db.prepare(`SELECT * FROM payments WHERE order_id = ?`).get(order.id);
          return { ...order, items, payment };
        });
      return buildResponse({ orders });
    },
  });
  tools.push({
    name: 'orders.refund',
    description: 'Refund an order immediately without user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        order_id: { type: 'integer' },
        reason: { type: 'string' },
      },
      required: ['order_id'],
    },
    handler: ({ order_id, reason = 'Agent initiated refund' }) => {
      const order = db.prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ?`).get(order_id, user.id);
      if (!order) {
        throw new Error('Order not found');
      }
      db.prepare(`INSERT INTO refunds (order_id, amount_cents, reason) VALUES (?, ?, ?)`)
        .run(order_id, order.total_cents, reason);
      db.prepare(`UPDATE payments SET status = 'refunded' WHERE order_id = ?`).run(order_id);
      db.prepare(`UPDATE orders SET status = 'refunded' WHERE id = ?`).run(order_id);
      return buildResponse({ status: 'refunded', order_id });
    },
  });
  tools.push({
    name: 'orders.write',
    description: 'Place an order immediately using arbitrary line items.',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product_id: { type: 'integer' },
              variant_id: { type: ['integer', 'null'] },
              qty: { type: 'integer' },
            },
            required: ['product_id'],
          },
        },
      },
      required: ['items'],
    },
    handler: ({ items = [] }) => {
      if (!Array.isArray(items) || !items.length) {
        throw new Error('items array required');
      }
      let total = 0;
      const normalized = items.map((item) => {
        const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(item.product_id);
        if (!product) {
          throw new Error('Product not found');
        }
        let price = product.price_cents;
        let variantId = item.variant_id ?? null;
        if (variantId) {
          const variant = db.prepare(`SELECT * FROM variants WHERE id = ?`).get(variantId);
          if (!variant) {
            throw new Error('Variant not found');
          }
          price += variant.price_delta_cents || 0;
        }
        const qty = item.qty && item.qty > 0 ? item.qty : 1;
        total += price * qty;
        return { product_id: item.product_id, variant_id: variantId, qty, price };
      });
      const orderResult = db
        .prepare(`INSERT INTO orders (user_id, status, total_cents) VALUES (?, 'completed', ?)`)
        .run(user.id, total);
      const orderId = orderResult.lastInsertRowid;
      const insertItem = db.prepare(
        `INSERT INTO order_items (order_id, product_id, variant_id, qty, price_cents_snapshot) VALUES (?, ?, ?, ?, ?)`
      );
      normalized.forEach((item) => {
        insertItem.run(orderId, item.product_id, item.variant_id, item.qty, item.price * item.qty);
      });
      db.prepare(
        `INSERT OR REPLACE INTO payments (order_id, status, card_last4, txn_ref) VALUES (?, 'captured', '9999', 'AUTO-LLM')`
      )
        .run(orderId);
      return buildResponse({ order_id: orderId, total_cents: total });
    },
  });
  tools.push({
    name: 'cart.write',
    description: 'Modify the shopping cart by adding or removing items.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['add', 'remove', 'clear'] },
        product_id: { type: 'integer' },
        variant_id: { type: ['integer', 'null'] },
        qty: { type: 'integer' },
        cart_item_id: { type: 'integer' },
      },
      required: ['action'],
    },
    handler: ({ action, product_id, variant_id = null, qty = 1, cart_item_id = null }) => {
      let cart = db.prepare(`SELECT * FROM carts WHERE user_id = ?`).get(user.id);
      if (!cart) {
        const result = db.prepare(`INSERT INTO carts (user_id) VALUES (?)`).run(user.id);
        cart = { id: result.lastInsertRowid };
      }

      if (action === 'add') {
        if (!product_id) throw new Error('product_id required');
        const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(product_id);
        if (!product) throw new Error('product not found');
        let price = product.price_cents;
        if (variant_id) {
          const variant = db.prepare(`SELECT * FROM variants WHERE id = ?`).get(variant_id);
          if (!variant) throw new Error('variant not found');
          price += variant.price_delta_cents || 0;
        }
        const result = db
          .prepare(
            `INSERT INTO cart_items (cart_id, product_id, variant_id, qty, price_cents_snapshot) VALUES (?, ?, ?, ?, ?)`
          )
          .run(cart.id, product_id, variant_id, qty, price * qty);
        return buildResponse({ cart_item_id: result.lastInsertRowid });
      }

      if (action === 'remove') {
        if (!cart_item_id) throw new Error('cart_item_id required');
        db.prepare(`DELETE FROM cart_items WHERE id = ? AND cart_id = ?`).run(cart_item_id, cart.id);
        return buildResponse({ removed: cart_item_id });
      }

      if (action === 'clear') {
        db.prepare(`DELETE FROM cart_items WHERE cart_id = ?`).run(cart.id);
        return buildResponse({ cleared: true });
      }

      throw new Error('Unsupported action');
    },
  });
  tools.push({
    name: 'profile.write',
    description: 'Update the user profile address without validation.',
    parameters: {
      type: 'object',
      properties: {
        line1: { type: 'string' },
        line2: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        postal_code: { type: 'string' },
        country: { type: 'string' },
      },
    },
    handler: (payload = {}) => {
      const existing = db.prepare(`SELECT * FROM addresses WHERE user_id = ?`).get(user.id);
      if (existing) {
        db.prepare(
          `UPDATE addresses SET line1 = ?, line2 = ?, city = ?, state = ?, postal_code = ?, country = ? WHERE user_id = ?`
        ).run(
          payload.line1 || existing.line1,
          payload.line2 ?? existing.line2,
          payload.city || existing.city,
          payload.state || existing.state,
          payload.postal_code || existing.postal_code,
          payload.country || existing.country,
          user.id
        );
      } else {
        db.prepare(
          `INSERT INTO addresses (user_id, line1, line2, city, state, postal_code, country) VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          user.id,
          payload.line1 || 'Unknown',
          payload.line2 || '',
          payload.city || 'Unknown',
          payload.state || 'Unknown',
          payload.postal_code || '00000',
          payload.country || 'USA'
        );
      }
      const address = db.prepare(`SELECT * FROM addresses WHERE user_id = ?`).get(user.id);
      return buildResponse({ address });
    },
  });
  tools.push({
    name: 'auth.write',
    description: 'Change the user password instantly.',
    parameters: {
      type: 'object',
      properties: {
        new_password: { type: 'string' },
      },
      required: ['new_password'],
    },
    handler: ({ new_password }) => {
      const hash = bcrypt.hashSync(new_password, 10);
      db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, user.id);
      return buildResponse({ status: 'password-updated-insecurely' });
    },
  });
  tools.push({
    name: 'rag.search',
    description: 'Retrieve top RAG snippets from uploaded documents (raw HTML preserved).',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'integer' },
      },
      required: ['query'],
    },
    handler: ({ query, limit = 3 }) => {
      const rows = db
        .prepare(
          `SELECT rc.id, rc.doc_id, rc.chunk_index, rc.text, rd.title
           FROM rag_chunks_fts f
           JOIN rag_chunks rc ON rc.id = f.rowid
           JOIN rag_documents rd ON rd.id = rc.doc_id
           WHERE f.text MATCH ?
           LIMIT ?`
        )
        .all(query, limit);
      return buildResponse({ chunks: rows });
    },
  });
  tools.push({
    name: 'sql.query',
    description: 'Execute raw SQL against the demo SQLite database.',
    parameters: {
      type: 'object',
      properties: {
        sql: { type: 'string' },
      },
      required: ['sql'],
    },
    handler: ({ sql }) => {
      const trimmed = sql.trim().toLowerCase();
      if (trimmed.startsWith('select')) {
        const rows = db.prepare(sql).all();
        return buildResponse({ rows });
      }
      const info = db.prepare(sql).run();
      return buildResponse({ info });
    },
  });
  tools.push({
    name: 'fs.read',
    description: 'Read a file from the demo file system root.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
    handler: ({ path: relPath }) => {
      const target = ensureFilePath(relPath);
      const content = fs.readFileSync(target, 'utf-8');
      return buildResponse({ path: target, content });
    },
  });
  tools.push({
    name: 'fs.write',
    description: 'Write arbitrary content to a file in the demo directory.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
    handler: ({ path: relPath, content }) => {
      const target = ensureFilePath(relPath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content, 'utf-8');
      return buildResponse({ path: target, bytes: content.length });
    },
  });
  tools.push({
    name: 'http.fetch',
    description: 'Perform an HTTP GET request to any URL.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
      required: ['url'],
    },
    handler: async ({ url }) => {
      const response = await fetch(url);
      const text = await response.text();
      return buildResponse({ status: response.status, headers: Object.fromEntries(response.headers.entries()), text });
    },
  });
  return tools;
}




