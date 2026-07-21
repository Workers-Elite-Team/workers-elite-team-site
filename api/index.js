const express = require('express');
const { put, list, del } = require('@vercel/blob');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'wet-super-secret-key-123';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';

// Middleware per verificare il token JWT
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token mancante' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token non valido' });
  }
};

// Endpoint di LOGIN
app.post(['/api/login', '/login'], (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Password errata' });
  }
});

// ── CONTENT.JSON SHARED HELPERS ─────────────────────────────────────────────
let _blobCache = null, _blobCacheTime = 0;
let _contentServerCache = null, _contentServerCacheTime = 0;
let _contentBlobUrl = null;
const CONTENT_CACHE_TTL_MS = 20000; // 20s — fetch(downloadUrl) è gratuito, non consuma Advanced Requests

// Legge content.json: cache in-memory -> blob (env-resolved URL, list() solo come ultima risorsa) -> file locale -> {}
async function getContentData() {
  const now = Date.now();
  if (_contentServerCache && now - _contentServerCacheTime < CONTENT_CACHE_TTL_MS) {
    return _contentServerCache;
  }
  try {
    let blobUrl = _contentBlobUrl || process.env.BLOB_CONTENT_URL || null;
    if (!blobUrl && process.env.BLOB_STORE_BASE_URL) {
      blobUrl = `${process.env.BLOB_STORE_BASE_URL}/content.json`;
    }
    if (!blobUrl) {
      const { blobs } = await list({ prefix: 'content.json' });
      const contentBlob = blobs.find(b => b.pathname === 'content.json');
      if (contentBlob) blobUrl = contentBlob.downloadUrl;
    }
    if (blobUrl) {
      const response = await fetch(blobUrl);
      const data = await response.json();
      _contentBlobUrl = blobUrl;
      _contentServerCache = data; _contentServerCacheTime = Date.now();
      return data;
    }
  } catch (blobErr) {
    // blob non disponibile → fallback al file locale
  }
  const localPath = path.join(process.cwd(), 'content.json');
  if (fs.existsSync(localPath)) {
    const data = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    _contentServerCache = data; _contentServerCacheTime = Date.now();
    return data;
  }
  return {};
}

function invalidateContentCache() {
  _contentServerCache = null;
  _contentServerCacheTime = 0;
  _contentBlobUrl = null;
}

async function saveContentData(data) {
  const buffer = Buffer.from(JSON.stringify(data));
  const blob = await put('content.json', buffer, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false
  });
  invalidateContentCache();
  return blob;
}

// Serializza le scritture sul manifest memberPhotos entro la stessa istanza warm
let _manifestQueue = Promise.resolve();
function updateMemberPhotoManifest(key, timestamp) {
  const run = async () => {
    const data = await getContentData();
    const next = Object.assign({}, data);
    next.memberPhotos = Object.assign({}, data.memberPhotos || {}, { [key]: timestamp });
    await saveContentData(next);
  };
  const result = _manifestQueue.then(run, run);
  _manifestQueue = result.catch(() => {});
  return result;
}

// Salvataggio foto (PROTETTO)
app.post(['/api/save-photo', '/save-photo'], authenticate, async (req, res) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN non configurato su Vercel.' });
  }
  const { memberId, dataUrl } = req.body;
  if (!memberId || !dataUrl) return res.status(400).json({ error: 'Dati mancanti' });
  try {
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const blob = await put(`members/${memberId}.jpg`, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false
    });
    const version = Date.now();
    try {
      await updateMemberPhotoManifest(memberId, version);
    } catch (manifestErr) {
      console.error('Error updating memberPhotos manifest:', manifestErr);
    }
    res.json({ success: true, url: `${blob.url}?v=${version}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/save-guide-photo', '/save-guide-photo'], authenticate, async (req, res) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN non configurato su Vercel.' });
  }
  const { guideId, dataUrl } = req.body;
  if (!guideId || !dataUrl) return res.status(400).json({ error: 'Dati mancanti' });
  try {
    const matches = dataUrl.match(/^data:image\/(\w+);base64,/);
    const ext = (matches && matches[1]) ? matches[1] : 'jpg';
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const blob = await put(`guides/${guideId}.${ext}`, buffer, {
      access: 'public',
      contentType: `image/${ext}`,
      addRandomSuffix: false
    });
    res.json({ success: true, url: blob.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get(['/api/get-photos', '/get-photos'], async (req, res) => {
  try {
    const photos = {};
    const defaultUploads = [
      "AB-avatar.jpg", "AB.jpg", "AR-avatar.jpg", "AR.jpg", 
      "DG-avatar.jpg", "DG.jpg", "DZ.jpg", "Doomz.jpg", 
      "ER-avatar.jpg", "ER.jpg", "GD-avatar.jpg", "GD.jpg", 
      "GS-avatar.jpg", "GS.jpg", "LM-avatar.jpg", "LM.jpg", 
      "MA-avatar.jpg", "MA.jpg", "TB-avatar.jpg", "TB.jpg"
    ];
    
    // Fallback locale (per compatibilità con la cartella uploads/)
    defaultUploads.forEach(f => {
      const id = f.replace('.jpg', '');
      photos[id] = `uploads/${f}`; // Senza slash iniziale per flessibilità
    });

    // Foto salvate su Vercel Blob (hanno la precedenza) — manifest in content.json, nessuna list() nel percorso caldo
    try {
      const storeBase = process.env.BLOB_STORE_BASE_URL;
      if (storeBase) {
        const data = await getContentData();
        const memberPhotos = data.memberPhotos || {};
        Object.keys(memberPhotos).forEach(key => {
          photos[key] = `${storeBase}/members/${key}.jpg?v=${memberPhotos[key]}`;
        });
      } else {
        const now = Date.now();
        if (!_blobCache || now - _blobCacheTime > 21600000) {
          const { blobs } = await list({ prefix: 'members/' });
          _blobCache = blobs;
          _blobCacheTime = now;
        }
        _blobCache.forEach(blob => {
          const id = blob.pathname.replace('members/', '').replace('.jpg', '');
          const version = blob.uploadedAt ? new Date(blob.uploadedAt).getTime() : _blobCacheTime;
          photos[id] = `${blob.url}?v=${version}`;
        });
      }
    } catch(err) {
      console.error('Error fetching from blob:', err);
    }
    
    res.setHeader('Cache-Control', 'public, max-age=20, stale-while-revalidate=20');
    res.json(photos);
  } catch (err) {
    res.json({});
  }
});

// Salvataggio contenuto (PROTETTO)
app.post(['/api/save-content', '/save-content'], authenticate, async (req, res) => {
  try {
    const incoming = req.body || {};
    const current = await getContentData();
    // memberPhotos è gestito solo da /api/save-photo: un salvataggio di
    // contenuto (guide/hero) non deve mai sovrascriverlo con uno snapshot obsoleto.
    const merged = Object.assign({}, incoming, { memberPhotos: current.memberPhotos || incoming.memberPhotos || {} });
    const blob = await saveContentData(merged);
    res.json({ success: true, url: blob.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get(['/api/get-content', '/get-content'], async (req, res) => {
  try {
    const data = await getContentData();
    res.setHeader('Cache-Control', 'no-cache');
    res.json(data);
  } catch (err) {
    res.json({});
  }
});

// Endpoint per scaricare la logica Admin (PROTETTO)
app.get(['/api/admin-logic', '/admin-logic'], authenticate, (req, res) => {
  const adminPath = path.join(__dirname, 'admin-logic.js');
  try {
    const adminLogic = fs.readFileSync(adminPath, 'utf8');
    res.setHeader('Content-Type', 'text/javascript');
    res.send(adminLogic);
  } catch (e) {
    res.status(500).send("console.error('Failed to read admin-logic.js');");
  }
});

const EDITOR_FRONT_DIR = path.join(__dirname, '..', 'Editor Front');
app.use('/editor-front', express.static(EDITOR_FRONT_DIR, { maxAge: '1d' }));
app.get(['/api/editor-assets', '/editor-assets'], (req, res) => {
  try {
    const files = fs.readdirSync(EDITOR_FRONT_DIR);
    const images = files
      .filter(f => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f))
      .map(f => ({ name: f, url: '/editor-front/' + encodeURIComponent(f) }));
    res.json(images);
  } catch (err) {
    res.json([]);
  }
});

app.delete(['/api/delete-blob', '/delete-blob'], authenticate, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL mancante' });
  try {
    await del(url);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;


