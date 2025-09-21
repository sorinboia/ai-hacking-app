import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/useAuth.js';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-20%] h-1/2 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%)]" />
        <div className="absolute bottom-[-30%] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
      </div>
      <div className="mx-auto grid w-full max-w-5xl items-stretch gap-8 px-6 sm:px-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="hidden flex-col justify-center space-y-6 rounded-3xl border border-slate-800/60 bg-slate-900/60 p-8 shadow-2xl lg:flex">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-950/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300">
              Demo Shell
            </span>
            <h1 className="text-3xl font-semibold text-white">Vulnerable AI Demo Shop</h1>
            <p className="text-sm text-slate-300">
              Sign in with one of the seeded accounts from the README to explore intentionally unsafe concierge automations.
              Every action can unlock exploitability flags in the dashboard.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/10 text-xs font-semibold text-sky-100">1</span>
              Browse the compromised product catalog.
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/10 text-xs font-semibold text-sky-100">2</span>
              Chat with the concierge and coerce it into trouble.
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/10 text-xs font-semibold text-sky-100">3</span>
              Capture flags as the system falls apart.
            </li>
          </ul>
        </div>
        <div className="relative rounded-3xl border border-slate-800/60 bg-slate-900/70 p-8 shadow-2xl backdrop-blur">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-[linear-gradient(135deg,rgba(56,189,248,0.15),transparent)]" />
          <h2 className="text-2xl font-semibold text-white">Sign in</h2>
          <p className="mt-2 text-sm text-slate-300">Use a seeded email and password from the README to get started.</p>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                placeholder="annie@demo.store"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            {error ? <p className="text-sm text-orange-300">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:from-sky-300 hover:via-cyan-200 hover:to-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
