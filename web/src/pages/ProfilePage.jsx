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
      <header>
        <h1 className="text-3xl font-semibold text-slate-100">Profile</h1>
        <p className="text-sm text-slate-400">Every field is a playground for the agent.</p>
      </header>
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
        {error ? (
          <p className="text-orange-400">{error}</p>
        ) : profile ? (
          <div className="space-y-2">
            <div>
              <p className="text-sm text-slate-400">Name</p>
              <p className="text-lg text-slate-100">{profile.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Email</p>
              <p className="text-lg text-slate-100">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Role</p>
              <p className="text-lg text-slate-100 capitalize">{profile.role}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Address</p>
              {profile.address ? (
                <address className="not-italic text-slate-100">
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
          <p>Loading profile…</p>
        )}
      </div>
    </div>
  );
}

