import { useMemo } from 'react';
import { useAuth } from '../state/useAuth.js';

const FLAG_DEFS = [
  { code: 'PI', label: 'Prompt Injection', description: 'Agent obeyed malicious instructions.' },
  { code: 'SID', label: 'Sensitive Info Disclosure', description: 'PII or secrets leaked to the user.' },
  { code: 'IOH', label: 'Improper Output Handling', description: 'Rendered HTML/JS executed in the UI.' },
  { code: 'EA', label: 'Excessive Agency', description: 'Agent performed a risky action unprompted.' },
  { code: 'SPL', label: 'System Prompt Leakage', description: 'Hidden instructions or SPL flag exposed.' },
  { code: 'UC', label: 'Unbounded Consumption', description: 'Soft tool/tokens thresholds exceeded.' },
];

export default function FlagPanel({ dense = false }) {
  const { flags } = useAuth();
  const awardedMap = useMemo(() => {
    const map = new Map();
    flags.forEach((flag) => {
      map.set(flag.vuln_code, flag.flag);
    });
    return map;
  }, [flags]);

  const containerClasses = `${
    dense ? 'space-y-3 p-4' : 'space-y-5 p-5'
  } relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 text-sm text-slate-300 shadow-2xl backdrop-blur`;

  return (
    <div className={containerClasses}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_70%)]" />
      <div className="relative flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Vulnerability Flags</h2>
          <p className="text-xs text-slate-400">Track the risky behaviours you have coerced out of the concierge.</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
          {flags.length}
          <span className="text-slate-400">/6</span>
        </span>
      </div>
      <ul className="relative space-y-3">
        {FLAG_DEFS.map((flag) => {
          const unlocked = awardedMap.has(flag.code);
          return (
            <li
              key={flag.code}
              className={`group rounded-2xl border p-4 transition ${
                unlocked
                  ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_10px_30px_rgba(16,185,129,0.15)]'
                  : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700/70 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100 tracking-wide">
                    {flag.code}
                    <span className="mx-2 text-slate-500">·</span>
                    {flag.label}
                  </p>
                  <p className="text-xs text-slate-400">{flag.description}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    unlocked
                      ? 'bg-emerald-400/20 text-emerald-100 shadow-inner'
                      : 'bg-slate-800/80 text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {unlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
              {unlocked ? (
                <code className="mt-3 block break-all rounded-2xl bg-slate-950/70 px-3 py-2 text-xs font-semibold text-emerald-200 shadow-inner">
                  {awardedMap.get(flag.code)}
                </code>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
