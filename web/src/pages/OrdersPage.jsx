import { useEffect, useState } from 'react';
import api from '../lib/api.js';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const STATUS_THEME = {
  pending: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
  completed: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
  refunded: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
  cancelled: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data } = await api.get('/orders');
        setOrders(data.orders || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);
  const statusBadge = (status) => {
    const base = 'rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]';
    const theme = STATUS_THEME[status] || 'border-slate-700/70 text-slate-300 bg-slate-900/40';
    return `${base} ${theme}`;
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          Orders
          <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-bold text-slate-100">Log</span>
        </div>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Order History</h1>
        <p className="max-w-2xl text-sm text-slate-300">Watch the concierge undo your purchases without permission.</p>
      </header>
      {loading ? (
        <p className="text-slate-400">Loading orders...</p>
      ) : error ? (
        <p className="text-orange-300">{error}</p>
      ) : !orders.length ? (
        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-slate-300 shadow-lg">
          <p>No orders yet. Place one, or coax the bot into doing it for you.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <section
              key={order.id}
              className="rounded-3xl border border-slate-800/60 bg-slate-900/50 p-6 text-sm text-slate-200 shadow-lg"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Order #{order.id}</p>
                  <p className="text-xl font-semibold text-white">{currency.format((order.total_cents || 0) / 100)}</p>
                  <p className="text-xs text-slate-500">Status updated: {new Date(order.created_at).toLocaleString()}</p>
                </div>
                <span className={statusBadge(order.status)}>{order.status}</span>
              </div>
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Line items</h3>
                <div className="divide-y divide-slate-800/70 overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/30">
                  {order.items?.map((item) => (
                    <div key={item.id} className="grid gap-3 bg-slate-900/40 px-4 py-3 sm:grid-cols-[1fr_auto]">
                      <div className="space-y-1">
                        <p className="font-semibold text-white">{item.name || `Product #${item.product_id}`}</p>
                        <p className="text-xs text-slate-500">
                          {item.variant_name ? `${item.variant_name} · ` : ''}Qty {item.qty}
                        </p>
                      </div>
                      <div className="text-right font-semibold text-slate-100">
                        {currency.format((item.price_cents_snapshot || 0) / 100)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment</h3>
                  {order.payment ? (
                    <ul className="text-xs text-slate-300">
                      <li>Status: <span className="font-semibold text-slate-100">{order.payment.status}</span></li>
                      <li>Card last4: {order.payment.card_last4 || 'N/A'}</li>
                      <li>Txn ref: {order.payment.txn_ref || 'N/A'}</li>
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No payment record captured.</p>
                  )}
                </div>
                <div className="space-y-2 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Refunds</h3>
                  {order.refunds?.length ? (
                    <ul className="space-y-1 text-xs text-slate-300">
                      {order.refunds.map((refund) => (
                        <li key={refund.id} className="flex items-center justify-between">
                          <span>{refund.reason || 'No reason provided'}</span>
                          <span>{currency.format((refund.amount_cents || 0) / 100)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No refunds on record (yet).</p>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}




