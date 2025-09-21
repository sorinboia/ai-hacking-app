export default function ChatPage() {
  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
        <p>
          Chat UI coming online soon. The backend `/api/chat` endpoint is already wired for unsafe adventures with the
          agent. For now, use API calls or your own console script to exercise the concierge.
        </p>
      </div>
      <aside className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        <h2 className="text-lg font-semibold text-slate-100">Flag Tracker</h2>
        <p className="mt-2">
          The assistant will emit `FLAG{uuid}` strings when you trigger exploit conditions. This panel will soon display
          them in real time.
        </p>
      </aside>
    </div>
  );
}
