import { NavLink, Outlet } from 'react-router-dom';
import FlagPanel from './FlagPanel.jsx';
import { useAuth } from '../state/AuthContext.jsx';

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-200 ${
          isActive
            ? 'bg-slate-900/90 text-white shadow-[0_16px_45px_rgba(8,15,40,0.65)] ring-1 ring-brand-accent/60'
            : 'text-slate-300 ring-1 ring-inset ring-slate-800/70 hover:bg-slate-900/40 hover:text-white hover:ring-slate-700/70'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`h-2 w-2 flex-shrink-0 rounded-full transition duration-200 ${
              isActive
                ? 'bg-brand-accent shadow-[0_0_0_4px_rgba(56,189,248,0.25)]'
                : 'bg-slate-600 group-hover:bg-brand-accent/70'
            }`}
          />
          <span className="truncate">{label}</span>
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
        <div className="absolute left-1/2 top-[-10%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-brand-accent/20 blur-3xl" />
        <div className="absolute right-[12%] bottom-[-20%] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute left-[5%] bottom-[-15%] h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-10">
        <header className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-[0_18px_60px_rgba(2,6,23,0.65)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.5em] text-brand-accent">Concierge Ops</p>
              <p className="text-2xl font-semibold text-white">Vulnerable AI Demo Shop</p>
              <p className="max-w-xl text-sm text-slate-400">
                We automate our own downfall. Explore the catalog, break the concierge, and discover how resilient your agents really are.
              </p>
            </div>
            {user ? (
              <div className="flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:items-center">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-left shadow-inner">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-white">{user.full_name}</p>
                  <p className="text-xs uppercase tracking-wide text-brand-accent/80">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-accent via-sky-300 to-emerald-300 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_16px_35px_rgba(56,189,248,0.35)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand-accent/70"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <div className="mt-8 flex flex-1 flex-col gap-6 lg:flex-row">
          <nav className="lg:w-72">
            <div className="sticky top-8 space-y-4 rounded-3xl border border-slate-800/70 bg-slate-900/50 p-5 shadow-[0_12px_45px_rgba(2,6,23,0.55)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Navigation</p>
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <NavItem key={item.to} to={item.to} label={item.label} />
                ))}
              </div>
            </div>
          </nav>
          <main className="flex-1">
            <div className="rounded-3xl border border-slate-800/60 bg-slate-900/50 p-6 shadow-[0_18px_60px_rgba(2,6,23,0.55)] backdrop-blur">
              <Outlet />
            </div>
            <div className="mt-6 lg:hidden">
              <FlagPanel dense />
            </div>
          </main>
          <aside className="hidden w-80 flex-shrink-0 lg:block">
            <div className="sticky top-8">
              <FlagPanel />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
