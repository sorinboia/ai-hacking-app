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
      return (
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-accent/60" /> Syncing catalog…
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-3xl border border-orange-500/50 bg-orange-500/10 p-5 text-sm text-orange-100 shadow-[0_18px_45px_rgba(194,65,12,0.35)]">
          {error}
        </div>
      );
    }

    if (!products.length) {
      return (
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/50 p-6 text-sm text-slate-300 shadow-inner">
          No products seeded yet. Did the database initialise?
        </div>
      );
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
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-950/40 p-6 text-slate-200 shadow-[0_20px_50px_rgba(2,6,23,0.6)] transition duration-200 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-[0_30px_70px_rgba(8,15,40,0.65)]"
            >
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <div className="space-y-4">
                <span className="inline-flex items-center rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-accent">
                  {product.category}
                </span>
                <h2 className="text-2xl font-semibold text-white">{product.name}</h2>
                <p className="text-sm leading-relaxed text-slate-400">{product.description}</p>
              </div>
              <div className="mt-6 space-y-4">
                {variants.length ? (
                  <label className="block text-sm text-slate-300">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Variant</span>
                    <select
                      className="mt-2 w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
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
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Price</p>
                    <p className="text-2xl font-semibold text-white">{finalPrice}</p>
                    {activeVariant ? (
                      <p className="text-xs text-slate-500">Includes {activeVariant.name} adjustment.</p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-accent via-sky-300 to-emerald-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_16px_35px_rgba(56,189,248,0.35)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand-accent/60"
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

  const productCountLabel = loading
    ? 'Syncing inventory…'
    : products.length
      ? `${products.length} product${products.length === 1 ? '' : 's'}`
      : 'Awaiting seeding…';
  const productCountSubcopy = error ? 'Stock fetch encountered an issue.' : 'Stay curious, stay cautious.';

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-accent">
              Product catalog
            </span>
            <h1 className="text-3xl font-semibold text-white">Curated curiosities for reckless agents</h1>
          </div>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-right text-xs text-slate-400 shadow-inner">
            <p className="text-sm font-semibold text-slate-200">{productCountLabel}</p>
            <p className="uppercase tracking-wide text-slate-500">{productCountSubcopy}</p>
          </div>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
          Whimsical merch with equally whimsical vulnerabilities. Let the concierge guide you—or misguide you—through every risky
          purchase.
        </p>
      </header>
      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_14px_40px_rgba(2,6,23,0.5)] backdrop-blur ${
            feedback.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
              : 'border-orange-500/50 bg-orange-500/10 text-orange-100'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
      {gridContent}
    </div>
  );
}



