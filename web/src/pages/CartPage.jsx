import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setCart(data.cart);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      setFeedback({ type: 'success', message: 'Item removed.' });
      await loadCart();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to remove item.' });
    }
  };

  const totals = useMemo(() => {
    const items = cart?.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.price_cents_snapshot || 0), 0);
    return {
      count: items.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
    };
  }, [cart]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-100">Shopping Cart</h1>
        <p className="text-sm text-slate-400">The concierge loves stuffing this cart without asking.</p>
      </header>
      {feedback ? (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-700/50 bg-emerald-900/20 text-emerald-200'
              : 'border-orange-700/60 bg-orange-900/20 text-orange-200'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
      {loading ? (
        <p className="text-slate-400">Loading cart contents…</p>
      ) : error ? (
        <p className="text-orange-400">{error}</p>
      ) : !cart?.items?.length ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
          <p>Your cart is empty. Ask the agent nicely (or impolitely) and watch it misbehave.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Variant</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {cart.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-slate-400">SKU: {item.product_sku || item.product_id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {item.variant_name ? item.variant_name : <span className="text-slate-600">Base</span>}
                    </td>
                    <td className="px-4 py-3">{item.qty}</td>
                    <td className="px-4 py-3 text-right">{currency.format((item.price_cents_snapshot || 0) / 100)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-400">
              <p>
                Items: <span className="font-semibold text-slate-100">{totals.count}</span>
              </p>
              <p>
                Subtotal: <span className="font-semibold text-slate-100">{currency.format(totals.subtotal / 100)}</span>
              </p>
            </div>
            <Link
              className="rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-300"
              to="/checkout"
            >
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}





