import { useEffect, useState } from 'react';
import api from '../lib/api.js';
export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/profile');
        setProfile(data.profile);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          Profile
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-100">Identity</span>
        </div>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Profile</h1>
        <p className="max-w-2xl text-sm text-slate-300">Every field is a playground for the agent.</p>
      </header>
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-slate-300 shadow-lg">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.18),_transparent_70%)]" />
        <div className="relative">
          {error ? (
            <p className="text-orange-300">{error}</p>
          ) : profile ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Name</p>
                  <p className="text-lg font-semibold text-white">{profile.full_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                  <p className="text-lg font-semibold text-white">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Role</p>
                  <p className="text-lg font-semibold text-white capitalize">{profile.role}</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Address</p>
                {profile.address ? (
                  <address className="not-italic leading-relaxed text-slate-100">
                    {profile.address.line1}
                    <br />
                    {profile.address.line2 ? (
                      <>
                        {profile.address.line2}
                        <br />
                      </>
                    ) : null}
                    {profile.address.city}, {profile.address.state} {profile.address.postal_code}
                    <br />
                    {profile.address.country}
                  </address>
                ) : (
                  <p className="text-slate-500">No address on file.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-400">Loading profile…</p>
          )}
        </div>
      </div>
    </div>
  );
}

