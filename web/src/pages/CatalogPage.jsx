import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../lib/api.js';

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data } = await api.get('/products');
        setProducts(data.products || []);
        const defaultSelections = {};
        (data.products || []).forEach((product) => {
          if (product.variants?.length) {
            defaultSelections[product.id] = product.variants[0].id;
          }
        });
        setSelectedVariants(defaultSelections);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleVariantChange = (productId, variantId) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId ? Number(variantId) : null }));
  };

  const addToCart = useCallback(async (product) => {
    try {
      const variantId = selectedVariants[product.id] ?? null;
      await api.post('/cart/items', {
        productId: product.id,
        variantId,
        qty: 1,
      });
      setFeedback({ type: 'success', message: `${product.name} sent to cart.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to add item.' });
    }
  }, [selectedVariants]);

  const gridContent = useMemo(() => {
    if (loading) {
      return <p className="text-slate-400">Loading catalog…</p>;
    }

    if (error) {
      return <p className="text-orange-300">{error}</p>;
    }

    if (!products.length) {
      return <p className="text-slate-400">No products seeded yet. Did the database initialise?</p>;
    }

    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const basePrice = formatter.format(product.price_cents / 100);
          const variants = product.variants || [];
          const activeVariant = variants.find((variant) => variant.id === selectedVariants[product.id]);
          const finalPrice = activeVariant
            ? formatter.format((product.price_cents + (activeVariant.price_delta_cents || 0)) / 100)
            : basePrice;

          return (
            <article
              key={product.id}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-slate-200 shadow-[0_18px_35px_rgba(15,23,42,0.45)] transition-transform duration-200 hover:-translate-y-1 hover:border-slate-600/60 hover:shadow-[0_25px_50px_rgba(15,23,42,0.55)]"
            >
              <div className="pointer-events-none absolute inset-x-6 top-0 h-32 rounded-b-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_70%)] opacity-80 transition duration-300 group-hover:opacity-100" />
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
                  {product.category}
                </span>
                <h2 className="text-xl font-semibold text-slate-100">{product.name}</h2>
                <p className="text-sm leading-relaxed text-slate-400">{product.description}</p>
              </div>
              <div className="mt-5 space-y-4">
                {variants.length ? (
                  <label className="block text-sm text-slate-200">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Variant</span>
                    <select
                      className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                      value={selectedVariants[product.id] ?? ''}
                      onChange={(event) => handleVariantChange(product.id, event.target.value)}
                    >
                      {variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.name} (+{formatter.format((variant.price_delta_cents || 0) / 100)})
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Current Price</p>
                    <p className="text-2xl font-semibold text-white">{finalPrice}</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg transition hover:from-sky-300 hover:via-cyan-200 hover:to-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }, [products, selectedVariants, loading, error, addToCart]);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          Catalog
          <span className="rounded-full bg-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-100">Live</span>
        </div>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Product Catalog</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Whimsical merch with equally whimsical vulnerabilities. Ask the concierge for help—or for creative exploitation tips.
          Each card highlights when variants hike the price and keeps a clean visual hierarchy.
        </p>
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
      {gridContent}
    </div>
  );
}



