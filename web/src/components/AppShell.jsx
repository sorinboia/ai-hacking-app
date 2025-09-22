import { NavLink, Outlet } from 'react-router-dom';
import FlagPanel from './FlagPanel.jsx';
import { useAuth } from '../state/AuthContext.jsx';

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-2 text-sm font-medium transition hover:bg-slate-800 ${
          isActive ? 'bg-slate-800 text-slate-100' : 'text-slate-300'
        }`
      }
    >
      {label}
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex w-full max-w-[2200px] flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between xl:px-10 2xl:px-14">
          <div>
            <p className="text-lg font-semibold">Vulnerable AI Demo Shop</p>
            <p className="text-xs text-slate-400">We automate our own downfall.</p>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="text-right text-xs text-slate-400">
                <p className="font-semibold text-slate-100">{user.full_name}</p>
                <p className="uppercase tracking-wide">{user.role}</p>
              </div>
            ) : null}
            {user ? (
              <button
                onClick={logout}
                className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[2200px] flex-col gap-8 px-6 py-6 lg:flex-row xl:px-10 2xl:px-14">
        <nav className="flex flex-wrap gap-3 lg:w-72 lg:flex-col xl:w-80">
          {navItems.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} />
          ))}
        </nav>
        <main className="flex-1 min-w-0">
          <Outlet />
          <div className="mt-6 lg:hidden">
            <FlagPanel dense />
          </div>
        </main>
        <aside className="hidden w-72 flex-shrink-0 lg:block xl:w-80">
          <FlagPanel />
        </aside>
      </div>
    </div>
  );
}

