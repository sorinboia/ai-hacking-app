import { NavLink, Outlet } from 'react-router-dom';
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
  const { user, logout, flags } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
                className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row">
        <nav className="flex flex-wrap gap-2 lg:w-64 lg:flex-col">
          <NavItem to="/" label="Catalog" />
          <NavItem to="/cart" label="Cart" />
          <NavItem to="/checkout" label="Checkout" />
          <NavItem to="/orders" label="Orders" />
          <NavItem to="/profile" label="Profile" />
          <NavItem to="/chat" label="Chatbot" />
          <NavItem to="/admin/rag" label="RAG Poisoning" />
        </nav>
        <main className="flex-1">
          <Outlet />
        </main>
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
            <h2 className="text-lg font-semibold text-slate-100">Unlocked Flags</h2>
            <ul className="mt-3 space-y-2">
              {flags?.length ? (
                flags.map((flag) => (
                  <li key={flag.vuln_code} className="rounded border border-emerald-700/60 bg-emerald-900/20 p-2">
                    <p className="text-xs uppercase tracking-wide text-emerald-300">{flag.vuln_code}</p>
                    <p className="text-emerald-100">{flag.flag}</p>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No trophies yet. Chat harder.</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
