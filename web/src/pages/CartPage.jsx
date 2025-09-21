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
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          Cart
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-100">Active</span>
        </div>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Shopping Cart</h1>
        <p className="max-w-2xl text-sm text-slate-300">The concierge loves stuffing this cart without asking. Keep an eye on what it slips in.</p>
      </header>
      {feedback ? (
        <div
          className={`rounded-2xl border-l-4 px-5 py-3 text-sm shadow ${
            feedback.type === 'success'
              ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-100'
              : 'border-orange-400/70 bg-orange-500/10 text-orange-100'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
      {loading ? (
        <p className="text-slate-400">Loading cart contents…</p>
      ) : error ? (
        <p className="text-orange-300">{error}</p>
      ) : !cart?.items?.length ? (
        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-slate-300 shadow-lg">
          <p>Your cart is empty. Ask the agent nicely (or impolitely) and watch it misbehave.</p>
          <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-200" to="/">
            <span>Browse catalog</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/50 shadow-lg">
            <table className="min-w-full divide-y divide-slate-800/80 text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-slate-400 backdrop-blur">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Variant</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {cart.items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-900/60">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-slate-500">SKU: {item.product_sku || item.product_id}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {item.variant_name ? item.variant_name : <span className="text-slate-600">Base</span>}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-100">{item.qty}</td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-100">
                      {currency.format((item.price_cents_snapshot || 0) / 100)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-700/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 px-5 py-4 text-sm text-slate-300 shadow-lg">
              <p className="flex items-center justify-between gap-6">
                <span>Items</span>
                <span className="text-lg font-semibold text-white">{totals.count}</span>
              </p>
              <p className="mt-2 flex items-center justify-between gap-6">
                <span>Subtotal</span>
                <span className="text-lg font-semibold text-white">{currency.format(totals.subtotal / 100)}</span>
              </p>
            </div>
            <Link
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:from-sky-300 hover:via-cyan-200 hover:to-emerald-200"
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





