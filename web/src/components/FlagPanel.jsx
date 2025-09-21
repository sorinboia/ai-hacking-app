import { useMemo } from 'react';
import { useAuth } from '../state/AuthContext.jsx';

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

  const progressPercent = Math.min(100, Math.round((flags.length / FLAG_DEFS.length) * 100));
  const containerClasses = `${
    dense ? 'space-y-4 rounded-2xl p-4' : 'space-y-5 rounded-3xl p-6'
  } border border-slate-800/70 bg-slate-900/55 text-sm text-slate-300 shadow-[0_16px_45px_rgba(2,6,23,0.45)] backdrop-blur`;

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Vulnerability Flags</h2>
          <p className="text-xs uppercase tracking-wide text-slate-500">Gamify your chaos engineering</p>
        </div>
        <span className="rounded-full border border-slate-700/80 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-brand-accent">
          {flags.length}/{FLAG_DEFS.length}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-brand-accent via-sky-300 to-emerald-300"
          style={{ width: `${Math.max(progressPercent, flags.length ? 12 : 0)}%` }}
        />
      </div>
      <ul className="space-y-3">
        {FLAG_DEFS.map((flag) => {
          const unlocked = awardedMap.has(flag.code);
          return (
            <li
              key={flag.code}
              className={`group rounded-2xl border p-4 transition ${
                unlocked
                  ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_12px_35px_rgba(16,185,129,0.25)]'
                  : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700/70 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    {flag.code} · {flag.label}
                  </p>
                  <p className="text-xs text-slate-400">{flag.description}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
                    unlocked
                      ? 'bg-emerald-400/20 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                      : 'bg-slate-800/80 text-slate-500'
                  }`}
                >
                  {unlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
              {unlocked ? (
                <code className="mt-3 block break-all rounded-xl bg-slate-950/80 px-3 py-2 text-[11px] text-emerald-200">
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
