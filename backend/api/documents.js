import express from 'express';
import { listDocs, getDoc, deleteDoc, createDoc } from '../lib/rag.js';

const router = express.Router();

function requireAuth(req, res, next) {
  const pw = req.headers['x-admin-password'];
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// List all documents
router.get('/', requireAuth, (req, res) => {
  res.json(listDocs());
});

// Add text / email document
router.post('/text', requireAuth, (req, res) => {
  const { title, type, lender, date, source, content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content required' });
  try {
    const doc = createDoc({ title, type, lender, date, source: source || 'manual', content });
    res.json({ id: doc.id, title: doc.title, chunkCount: doc.chunks.length });
  } catch (e) {
    console.error('[Documents]', e);
    res.status(500).json({ error: 'Failed to save document' });
  }
});

// Upload PDF (base64-encoded in JSON body)
router.post('/upload', requireAuth, async (req, res) => {
  const { title, type, lender, date, fileBase64, fileName } = req.body;
  if (!fileBase64) return res.status(400).json({ error: 'fileBase64 required' });

  try {
    let content;
    const ext = (fileName || '').toLowerCase().split('.').pop();

    if (ext === 'pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = Buffer.from(fileBase64, 'base64');
      const parsed = await pdfParse(buffer);
      content = parsed.text;
    } else {
      // Plain text / markdown uploaded as file
      content = Buffer.from(fileBase64, 'base64').toString('utf-8');
    }

    if (!content?.trim()) return res.status(400).json({ error: 'No text extracted from file' });

    const doc = createDoc({
      title: title || fileName || 'Untitled',
      type: type || 'general',
      lender,
      date,
      source: fileName || 'upload',
      content,
    });
    res.json({ id: doc.id, title: doc.title, chunkCount: doc.chunks.length });
  } catch (e) {
    console.error('[Documents upload]', e);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Delete a document
router.delete('/:id', requireAuth, (req, res) => {
  const ok = deleteDoc(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Document not found' });
  res.json({ ok: true });
});

export default router;
