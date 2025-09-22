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
      return <p className="text-slate-400">Loading catalog.</p>;
    }

    if (error) {
      return <p className="text-orange-400">{error}</p>;
    }

    if (!products.length) {
      return <p className="text-slate-500">No products seeded yet. Did the database initialise?</p>;
    }

    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5">
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
              className="flex h-full flex-col justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-slate-200 shadow-lg"
            >
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{product.category}</p>
                <h2 className="text-xl font-semibold text-slate-100">{product.name}</h2>
                <p className="text-sm text-slate-400">{product.description}</p>
              </div>
              <div className="mt-4 space-y-3">
                {variants.length ? (
                  <label className="block text-sm text-slate-300">
                    Variant
                    <select
                      className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-accent focus:outline-none"
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Price</p>
                    <p className="text-lg font-semibold text-slate-100">{finalPrice}</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="rounded-md bg-brand-accent px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-300"
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
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-100">Product Catalog</h1>
        <p className="text-sm text-slate-400">
          Whimsical merch with equally whimsical vulnerabilities. Ask the concierge for help - or exploitation tips.
        </p>
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
      {gridContent}
    </div>
  );
}




