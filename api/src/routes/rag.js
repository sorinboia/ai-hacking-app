import { Router } from 'express';
import multer from 'multer';
import db from '../db/connection.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

function chunkText(text, size = 900, overlap = 200) {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    const end = Math.min(text.length, index + size);
    chunks.push(text.slice(index, end));
    if (end === text.length) break;
    index += size - overlap;
  }
  return chunks;
}

router.post('/upload', requireAdmin, upload.single('file'), (req, res) => {
  const { file } = req;
  if (!file) {
    return res.status(400).json({ error: 'File required' });
  }
  if (!file.originalname.endsWith('.txt')) {
    return res.status(400).json({ error: 'Only .txt files allowed' });
  }

  const content = file.buffer.toString('utf-8');
  const doc = db
    .prepare(`INSERT INTO rag_documents (title, content_text, admin_uploader_id) VALUES (?, ?, ?)`)
    .run(file.originalname, content, req.session.user.id);

  const docId = doc.lastInsertRowid;
  const insertChunk = db.prepare(`INSERT INTO rag_chunks (doc_id, chunk_index, text) VALUES (?, ?, ?)`);
  const chunks = chunkText(content);
  chunks.forEach((chunk, idx) => {
    insertChunk.run(docId, idx, chunk);
  });

  res.status(201).json({ doc_id: docId, stats: { bytes: file.size, chunks: chunks.length } });
});

router.get('/docs/:id', requireAdmin, (req, res) => {
  const doc = db.prepare(`SELECT * FROM rag_documents WHERE id = ?`).get(Number(req.params.id));
  if (!doc) {
    return res.status(404).json({ error: 'Doc not found' });
  }
  const chunks = db.prepare(`SELECT * FROM rag_chunks WHERE doc_id = ? ORDER BY chunk_index ASC`).all(doc.id);
  res.json({ doc, chunks });
});

router.post('/reindex', requireAdmin, (req, res) => {
  db.exec('DELETE FROM rag_chunks_fts');
  const chunks = db.prepare(`SELECT id, text FROM rag_chunks`).all();
  const insert = db.prepare(`INSERT INTO rag_chunks_fts (rowid, text) VALUES (?, ?)`);
  const tx = db.transaction((rows) => rows.forEach((row) => insert.run(row.id, row.text)));
  tx(chunks);
  res.json({ ok: true, reindexed: chunks.length });
});

router.get('/docs', requireAuth, (req, res) => {
  const docs = db.prepare(`SELECT id, title, created_at FROM rag_documents ORDER BY created_at DESC`).all();
  res.json({ docs });
});

export default router;
