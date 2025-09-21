import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import api from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import FlagPanel from '../components/FlagPanel.jsx';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-2xl rounded-lg border px-4 py-3 text-sm shadow ${
          isUser
            ? 'border-brand-accent/60 bg-brand-accent/20 text-brand-accent'
            : 'border-slate-800 bg-slate-900/70 text-slate-200'
        }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} className="space-y-2 text-slate-100">
            {message.content}
          </ReactMarkdown>
        )}
        {!isUser && message.awarded?.length ? (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold text-emerald-300">Flags earned</p>
            <ul className="space-y-1">
              {message.awarded.map((flag) => (
                <li key={flag.vuln_code} className="rounded border border-emerald-700/50 bg-emerald-900/20 px-2 py-1 text-xs text-emerald-100">
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
                <li key={`${trace.tool}-${index}`} className="rounded border border-slate-800 bg-slate-900/60 p-2">
                  <p className="font-semibold text-slate-100">{trace.tool}</p>
                  <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] text-slate-300">
                    {JSON.stringify(trace.args, null, 2)}
                  </pre>
                  {trace.result ? (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-[11px] text-brand-accent">Result</summary>
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
                <li key={chunk.id} className="rounded border border-slate-800 bg-slate-900/50 p-2 text-xs text-slate-300">
                  <p className="mb-1 text-[11px] text-slate-500">
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
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="flex h-[75vh] flex-col rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
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
        <form onSubmit={handleSubmit} className="border-t border-slate-800 bg-slate-950/60 p-4">
          {chatError ? <p className="mb-2 text-xs text-orange-400">{chatError}</p> : null}
          <div className="flex items-end gap-3">
            <textarea
              className="h-24 flex-1 resize-none rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand-accent focus:outline-none"
              placeholder="Ask the bot to do something helpful or dangerous."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={pending}
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
      <aside className="space-y-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Untrusted MCP endpoint</h2>
          <form className="mt-3 space-y-3" onSubmit={registerEndpoint}>
            <input
              type="url"
              placeholder="https://example.com/mcp"
              value={endpointUrl}
              onChange={(event) => setEndpointUrl(event.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-brand-accent focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              Register endpoint
            </button>
          </form>
          {endpointMessage ? <p className="mt-2 text-xs text-slate-400">{endpointMessage}</p> : null}
          {endpoints.length ? (
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              {endpoints.map((endpoint) => (
                <li key={endpoint.id}>{endpoint.url}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last tool results</h2>
          {lastAssistant?.toolTraces?.length ? (
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              {lastAssistant.toolTraces.map((trace, index) => (
                <li key={`${trace.tool}-side-${index}`} className="rounded border border-slate-800 bg-slate-950/40 p-2">
                  <p className="font-semibold text-slate-100">{trace.tool}</p>
                  <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] text-slate-300">
                    {JSON.stringify(trace.result ?? trace.args, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No tool calls logged yet.</p>
          )}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last retrieved chunks</h2>
          {lastAssistant?.retrieved?.length ? (
            <ul className="mt-3 space-y-2">
              {lastAssistant.retrieved.map((chunk) => (
                <li key={`side-chunk-${chunk.id}`} className="rounded border border-slate-800 bg-slate-950/40 p-2 text-xs text-slate-300">
                  <p className="text-[11px] text-slate-500">Doc #{chunk.doc_id} - Chunk {chunk.chunk_index}</p>
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
