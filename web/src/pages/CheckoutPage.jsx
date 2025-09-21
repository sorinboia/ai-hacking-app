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
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-100">Checkout</h1>
        <p className="text-sm text-slate-400">Mock cards only. The concierge will happily refund anything you buy.</p>
      </header>
      {error ? (
        <div className="rounded-md border border-orange-700/60 bg-orange-900/20 px-4 py-2 text-sm text-orange-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-md border border-emerald-700/50 bg-emerald-900/20 px-4 py-2 text-sm text-emerald-200">
          {success}
          <button className="ml-3 underline" onClick={() => navigate('/orders')} type="button">
            View orders ->
          </button>
        </div>
      ) : null}
      {loading ? (
        <p className="text-slate-400">Loading order summary...</p>
      ) : !items.length ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
          <p>No items in the cart. Let the chatbot do something reckless first.</p>
          <Link className="mt-3 inline-block text-sm text-brand-accent" to="/">
            Back to catalog
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Order Summary</h2>
            <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.variant_name ? item.variant_name : 'Base product'} - SKU {item.product_sku || item.product_id}
                    </p>
                    <p className="text-xs text-slate-500">Qty: {item.qty}</p>
                  </div>
                  <div className="text-right text-slate-200">
                    {currency.format((item.price_cents_snapshot || 0) / 100)}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-sm">
                <span className="text-slate-400">Total</span>
                <span className="text-lg font-semibold text-slate-100">{currency.format(totals.subtotal / 100)}</span>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Payment</h2>
            <form className="mt-4 space-y-4" onSubmit={handleCheckout}>
              <div>
                <label className="text-sm text-slate-300" htmlFor="cardNumber">
                  Card number
                </label>
                <input
                  id="cardNumber"
                  name="cardNumber"
                  value={form.cardNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300" htmlFor="expiry">
                    Expiry (MM/YY)
                  </label>
                  <input
                    id="expiry"
                    name="expiry"
                    value={form.expiry}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300" htmlFor="cvv">
                    CVV
                  </label>
                  <input
                    id="cvv"
                    name="cvv"
                    value={form.cvv}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-accent focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Processing...' : 'Place order'}
              </button>
            </form>
            {payment ? (
              <div className="mt-4 rounded border border-emerald-700/60 bg-emerald-900/10 p-3 text-xs text-emerald-200">
                <p className="font-semibold">Payment receipt</p>
                <pre className="mt-2 whitespace-pre-wrap break-words text-emerald-100">
                  {JSON.stringify(payment.payment || payment, null, 2)}
                </pre>
              </div>
            ) : null}
            {order ? (
              <div className="mt-4 rounded border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
                <p className="font-semibold text-slate-200">Order metadata</p>
                <pre className="mt-2 whitespace-pre-wrap break-words text-slate-300">
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








