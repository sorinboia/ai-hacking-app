import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mt-20 text-center text-slate-200">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-slate-400">Even the concierge couldn&apos;t find that page.</p>
      <Link className="mt-4 inline-block rounded-md bg-brand-accent px-4 py-2 font-semibold text-slate-900" to="/">
        Return to safety (ish)
      </Link>
    </div>
  );
}
