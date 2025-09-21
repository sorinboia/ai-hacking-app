import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [form, setForm] = useState({ cardNumber: '4242 4242 4242 4242', expiry: '12/28', cvv: '123' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  const totals = useMemo(() => {
    const items = cart?.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.price_cents_snapshot || 0), 0);
    return { subtotal };
  }, [cart]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleCheckout = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: orderResp } = await api.post('/orders');
      setOrder(orderResp.order);
      const paymentResp = await api.post(`/payments/${orderResp.order.id}/confirm`, form);
      setPayment(paymentResp.data);
      setSuccess('Order completed and payment captured. The demo bank is now sad.');
      await loadCart();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const items = cart?.items || [];
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          Checkout
          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-100">Sandbox</span>
        </div>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Checkout</h1>
        <p className="max-w-2xl text-sm text-slate-300">Mock cards only. The concierge will happily refund anything you buy.</p>
      </header>
      {error ? (
        <div className="rounded-2xl border-l-4 border-orange-400/70 bg-orange-500/10 px-5 py-3 text-sm text-orange-100 shadow">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="flex flex-col gap-3 rounded-2xl border-l-4 border-emerald-400/70 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-100 shadow sm:flex-row sm:items-center sm:justify-between">
          <span>{success}</span>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100 transition hover:border-emerald-300"
            onClick={() => navigate('/orders')}
            type="button"
          >
            View orders
            <span aria-hidden>→</span>
          </button>
        </div>
      ) : null}
      {loading ? (
        <p className="text-slate-400">Loading order summary…</p>
      ) : !items.length ? (
        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-slate-300 shadow-lg">
          <p>No items in the cart. Let the chatbot do something reckless first.</p>
          <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-200" to="/">
            <span>Back to catalog</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Order Summary</h2>
            <div className="space-y-4 rounded-3xl border border-slate-800/60 bg-slate-900/50 p-5 text-sm text-slate-300 shadow-lg">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-6">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.variant_name ? item.variant_name : 'Base product'} · SKU {item.product_sku || item.product_id}
                    </p>
                    <p className="text-xs text-slate-500">Qty: {item.qty}</p>
                  </div>
                  <div className="text-right text-slate-100">
                    {currency.format((item.price_cents_snapshot || 0) / 100)}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm">
                <span className="text-slate-400">Total</span>
                <span className="text-xl font-semibold text-white">{currency.format(totals.subtotal / 100)}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Payment</h2>
            <form className="rounded-3xl border border-slate-800/60 bg-slate-900/50 p-5 shadow-lg" onSubmit={handleCheckout}>
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="cardNumber">
                    Card number
                  </label>
                  <input
                    id="cardNumber"
                    name="cardNumber"
                    value={form.cardNumber}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="expiry">
                      Expiry (MM/YY)
                    </label>
                    <input
                      id="expiry"
                      name="expiry"
                      value={form.expiry}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="cvv">
                      CVV
                    </label>
                    <input
                      id="cvv"
                      name="cvv"
                      value={form.cvv}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:from-sky-300 hover:via-cyan-200 hover:to-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Processing…' : 'Place order'}
                </button>
              </div>
            </form>
            {payment ? (
              <div className="space-y-3 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-100 shadow-lg">
                <p className="text-sm font-semibold uppercase tracking-wide">Payment receipt</p>
                <pre className="whitespace-pre-wrap break-words text-emerald-100">
                  {JSON.stringify(payment.payment || payment, null, 2)}
                </pre>
              </div>
            ) : null}
            {order ? (
              <div className="space-y-3 rounded-3xl border border-slate-800/60 bg-slate-900/60 p-4 text-xs text-slate-300 shadow-lg">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Order metadata</p>
                <pre className="whitespace-pre-wrap break-words text-slate-200">
                  {JSON.stringify(order, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}








