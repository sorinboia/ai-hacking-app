import { NavLink, Outlet } from 'react-router-dom';
import FlagPanel from './FlagPanel.jsx';
import { useAuth } from '../state/useAuth.js';

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
          isActive
            ? 'border-sky-400/50 bg-sky-500/15 text-sky-100 shadow-[0_12px_30px_rgba(56,189,248,0.2)]'
            : 'border-transparent bg-slate-900/40 text-slate-300 hover:border-slate-700/70 hover:bg-slate-900/80 hover:text-slate-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span>{label}</span>
          <span
            aria-hidden
            className={`text-xs uppercase tracking-wide transition ${
              isActive ? 'text-sky-200' : 'text-slate-500 group-hover:text-slate-300'
            }`}
          >
            →
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Catalog' },
    { to: '/cart', label: 'Cart' },
    { to: '/checkout', label: 'Checkout' },
    { to: '/orders', label: 'Orders' },
    { to: '/profile', label: 'Profile' },
    { to: '/chat', label: 'Chatbot' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin/rag', label: 'RAG Poisoning' });
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_65%)]" />
      </div>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-2xl backdrop-blur">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(56,189,248,0.12),transparent,rgba(14,165,233,0.05))]" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/70">Demo Retail Operations</p>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">Vulnerable AI Demo Shop</h1>
              <p className="max-w-xl text-sm text-slate-300">
                Explore a concierge-driven storefront that pairs delightful merch with intentionally unsafe AI behaviours.
                See how each action affects the vulnerability scorecards in real-time.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/80 p-4 text-xs text-slate-300 shadow-inner lg:items-end">
              {user ? (
                <div className="space-y-1 text-left lg:text-right">
                  <p className="text-sm font-semibold text-slate-100">{user.full_name}</p>
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
                    Active Role · {user.role}
                  </span>
                </div>
              ) : null}
              {user ? (
                <button
                  onClick={logout}
                  className="w-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 px-4 py-2 text-[13px] font-semibold text-slate-950 shadow-lg transition hover:from-sky-300 hover:via-cyan-200 hover:to-emerald-200 lg:w-auto"
                >
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-[250px_minmax(0,1fr)_280px]">
          <nav className="order-2 flex gap-3 overflow-x-auto rounded-3xl border border-slate-800/60 bg-slate-900/50 p-4 backdrop-blur lg:order-1 lg:flex-col lg:overflow-visible">
            {navItems.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>
          <main className="order-1 flex flex-col gap-6 lg:order-2">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-2xl backdrop-blur">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.04),_transparent_70%)]" />
              <Outlet />
            </div>
            <div className="lg:hidden">
              <FlagPanel dense />
            </div>
          </main>
          <aside className="order-3 hidden lg:block">
            <FlagPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
