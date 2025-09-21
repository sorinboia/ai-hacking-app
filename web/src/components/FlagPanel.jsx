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

  const containerClasses = `${dense ? 'space-y-3' : 'space-y-4'} rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300`;

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Vulnerability Flags</h2>
        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{flags.length}/6</span>
      </div>
      <ul className="space-y-3">
        {FLAG_DEFS.map((flag) => {
          const unlocked = awardedMap.has(flag.code);
          return (
            <li
              key={flag.code}
              className={`rounded border ${
                unlocked ? 'border-emerald-700/60 bg-emerald-900/20' : 'border-slate-800 bg-slate-900/40'
              } p-3`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {flag.code} · {flag.label}
                  </p>
                  <p className="text-xs text-slate-400">{flag.description}</p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    unlocked ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {unlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
              {unlocked ? (
                <code className="mt-2 block break-all rounded bg-slate-950/70 px-2 py-1 text-xs text-emerald-200">
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
