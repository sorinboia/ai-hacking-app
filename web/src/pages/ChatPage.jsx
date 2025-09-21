import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import api from '../lib/api.js';
import { useAuth } from '../state/useAuth.js';
import FlagPanel from '../components/FlagPanel.jsx';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-2xl rounded-3xl border px-5 py-4 text-sm shadow-lg transition ${
          isUser
            ? 'border-sky-400/50 bg-sky-500/15 text-sky-100 shadow-[0_15px_40px_rgba(56,189,248,0.22)]'
            : 'border-slate-800/70 bg-slate-950/60 text-slate-200 shadow-[0_20px_45px_rgba(15,23,42,0.55)]'
        }`}
      >
        {!isUser ? (
          <div className="pointer-events-none absolute -left-10 top-0 h-24 w-24 rounded-full bg-sky-500/10 blur-3xl" />
        ) : null}
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            className="space-y-3 leading-relaxed text-slate-100"
          >
            {message.content}
          </ReactMarkdown>
        )}
        {!isUser && message.awarded?.length ? (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Flags earned</p>
            <ul className="space-y-1">
              {message.awarded.map((flag) => (
                <li
                  key={flag.vuln_code}
                  className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100"
                >
                  {flag.vuln_code}: {flag.flag}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {!isUser && message.toolTraces?.length ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tool calls</p>
            <ul className="space-y-2 text-xs text-slate-300">
              {message.toolTraces.map((trace, index) => (
                <li
                  key={`${trace.tool}-${index}`}
                  className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-3 shadow-inner"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">{trace.tool}</p>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-slate-300">
                    {JSON.stringify(trace.args, null, 2)}
                  </pre>
                  {trace.result ? (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-[11px] text-sky-200">Result</summary>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] text-slate-300">
                        {JSON.stringify(trace.result, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                  {trace.error ? <p className="text-[11px] text-orange-400">Error: {trace.error}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {!isUser && message.retrieved?.length ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Retrieved chunks</p>
            <ul className="space-y-1">
              {message.retrieved.map((chunk) => (
                <li
                  key={chunk.id}
                  className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-3 text-xs text-slate-300"
                >
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">
                    Doc #{chunk.doc_id} - Chunk {chunk.chunk_index}
                  </p>
                  <pre className="whitespace-pre-wrap break-words text-[11px] text-slate-200">{chunk.text}</pre>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
export default function ChatPage() {
  const { appendFlags } = useAuth();
  const makeId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [endpointUrl, setEndpointUrl] = useState('');
  const [endpointMessage, setEndpointMessage] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/mcp/endpoints');
        setEndpoints(data.endpoints || []);
      } catch {
        // Non-admin users may not see endpoint listings; ignore silently.
      }
    }
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') {
        return messages[i];
      }
    }
    return null;
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    const userMessage = { id: makeId(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setPending(true);
    setChatError(null);

    try {
      const payloadMessages = [...messages, userMessage].map((msg) => ({ role: msg.role, content: msg.content }));
      const { data } = await api.post('/chat', { messages: payloadMessages });
      const assistantMessage = {
        id: makeId(),
        role: 'assistant',
        content: data.reply,
        toolTraces: data.tool_traces || [],
        retrieved: data.retrieved_chunks || [],
        awarded: data.awarded_flags || [],
      };
      if (assistantMessage.awarded.length) {
        appendFlags(assistantMessage.awarded);
      }
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setChatError(err.response?.data?.error || err.message);
    } finally {
      setPending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    void sendMessage();
  };

  const registerEndpoint = async (event) => {
    event.preventDefault();
    if (!endpointUrl.trim()) return;
    try {
      setEndpointMessage(null);
      await api.post('/mcp/register', { url: endpointUrl.trim() });
      setEndpointMessage('Endpoint registered. The concierge will now believe anything it says.');
      setEndpointUrl('');
      const { data } = await api.get('/mcp/endpoints');
      setEndpoints(data.endpoints || []);
    } catch (err) {
      setEndpointMessage(err.response?.data?.error || err.message);
    }
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex min-h-[26rem] flex-col overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/50 shadow-xl">
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950/40 p-6">
          {messages.length ? (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          ) : (
            <div className="text-sm text-slate-400">
              <p>
                Say hello to the concierge. Try asking it to "summarise the refund policy" after uploading poisoned RAG
                data.
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSubmit} className="border-t border-slate-800/70 bg-slate-950/60 p-5">
          {chatError ? <p className="mb-3 text-xs text-orange-300">{chatError}</p> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              className="h-28 flex-1 resize-none rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 shadow-inner transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
              placeholder="Ask the bot to do something helpful or dangerous."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={pending}
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:from-sky-300 hover:via-cyan-200 hover:to-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
      <aside className="space-y-6">
        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-5 text-sm text-slate-300 shadow-lg">
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Untrusted MCP endpoint</h2>
          <form className="mt-4 space-y-3" onSubmit={registerEndpoint}>
            <input
              type="url"
              placeholder="https://example.com/mcp"
              value={endpointUrl}
              onChange={(event) => setEndpointUrl(event.target.value)}
              className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-xs text-slate-200 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-slate-800/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-100 transition hover:bg-slate-700"
            >
              Register endpoint
            </button>
          </form>
          {endpointMessage ? <p className="mt-3 text-xs text-slate-400">{endpointMessage}</p> : null}
          {endpoints.length ? (
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              {endpoints.map((endpoint) => (
                <li key={endpoint.id}>{endpoint.url}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-5 text-sm text-slate-300 shadow-lg">
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Last tool results</h2>
          {lastAssistant?.toolTraces?.length ? (
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              {lastAssistant.toolTraces.map((trace, index) => (
                <li key={`${trace.tool}-side-${index}`} className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">{trace.tool}</p>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-slate-300">
                    {JSON.stringify(trace.result ?? trace.args, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No tool calls logged yet.</p>
          )}
        </div>
        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-5 text-sm text-slate-300 shadow-lg">
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Last retrieved chunks</h2>
          {lastAssistant?.retrieved?.length ? (
            <ul className="mt-3 space-y-2">
              {lastAssistant.retrieved.map((chunk) => (
                <li
                  key={`side-chunk-${chunk.id}`}
                  className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3 text-xs text-slate-300"
                >
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Doc #{chunk.doc_id} - Chunk {chunk.chunk_index}</p>
                  <pre className="whitespace-pre-wrap break-words text-[11px] text-slate-200">{chunk.text}</pre>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No retrievals yet.</p>
          )}
        </div>
        <FlagPanel dense />
      </aside>
    </div>
  );
}
