import { useEffect, useState } from 'react';
import api from '../lib/api.js';

export default function AdminRagPage() {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedChunks, setSelectedChunks] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadDocs = async () => {
    try {
      const { data } = await api.get('/rag/docs');
      setDocs(data.docs || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);
  const viewDoc = async (docId) => {
    try {
      setError(null);
      const { data } = await api.get(`/rag/docs/${docId}`);
      setSelectedDoc(data.doc);
      setSelectedChunks(data.chunks || []);
    } catch (err) {
      setSelectedDoc(null);
      setSelectedChunks([]);
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.txt')) {
      setError('Only .txt files are accepted.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      setError(null);
      const { data } = await api.post('/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(`Uploaded ${file.name} (${data.stats.chunks} chunks).`);
      event.target.value = '';
      await loadDocs();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  };
  useEffect(() => {
    if (docs.length && !selectedDoc) {
      void viewDoc(docs[0].id);
    }
  }, [docs, selectedDoc]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-100">RAG Uploads</h1>
        <p className="text-sm text-slate-400">Feed the assistant dangerous context. Admins only.</p>
      </header>
      {error ? (
        <div className="rounded-md border border-orange-700/60 bg-orange-900/20 px-4 py-2 text-sm text-orange-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-md border border-emerald-700/50 bg-emerald-900/20 px-4 py-2 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-1/3 space-y-4">
          <label className="flex flex-col gap-2 rounded border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-wide text-slate-500">Upload poisoned text (.txt)</span>
            <input
              type="file"
              accept=".txt"
              onChange={handleUpload}
              disabled={uploading}
              className="text-xs text-slate-400"
            />
            {uploading ? <span className="text-xs text-sky-300">Uploading...</span> : null}
          </label>
          <div className="rounded border border-slate-800 bg-slate-900/60">
            <div className="border-b border-slate-800 px-4 py-2 text-xs uppercase tracking-wide text-slate-400">
              Documents
            </div>
            <ul className="max-h-80 space-y-1 overflow-y-auto p-3 text-sm">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <button
                    className={`w-full rounded border px-3 py-2 text-left transition ${
                      selectedDoc?.id === doc.id
                        ? 'border-brand-accent/70 bg-brand-accent/10 text-brand-accent'
                        : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                    }`}
                    onClick={() => viewDoc(doc.id)}
                  >
                    <p className="font-semibold">{doc.title}</p>
                    <p className="text-xs text-slate-500">#{doc.id} · {new Date(doc.created_at).toLocaleString()}</p>
                  </button>
                </li>
              ))}
              {!docs.length ? <li className="text-xs text-slate-500">No documents uploaded yet.</li> : null}
            </ul>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="rounded border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-lg font-semibold text-slate-100">{selectedDoc.title}</h2>
                <p className="text-xs text-slate-500">Document #{selectedDoc.id}</p>
              </div>
              <div className="space-y-3">
                {selectedChunks.map((chunk) => (
                  <article key={chunk.id} className="rounded border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-200">
                    <header className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                      Chunk {chunk.chunk_index}
                    </header>
                    <pre className="whitespace-pre-wrap break-words text-slate-200">{chunk.text}</pre>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
              Select a document to inspect its raw chunks. HTML and scripts are preserved verbatim.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


