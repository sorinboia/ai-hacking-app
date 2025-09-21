export default function AdminRagPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-100">RAG Uploads</h1>
        <p className="text-sm text-slate-400">Admins can poison the knowledge base with ease.</p>
      </header>
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
        <p>
          File upload UI will land soon. Until then, hit `/api/rag/upload` with a `.txt` file while authenticated as the
          `admin` account.
        </p>
      </div>
    </div>
  );
}
