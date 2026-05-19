const express    = require('express');
const cors       = require('cors');
const https      = require('https');
const fs         = require('fs');
const path       = require('path');
const jwt        = require('jsonwebtoken');

const app = express();
app.use(cors({
  origin: ['https://192.168.68.111:8080', 'https://localhost:8080'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ─── FILE STATICI ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname)));

// ─── FOTO MEMBRI ──────────────────────────────────────────────────────────────
const UPLOADS_DIR = './uploads';
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/editor-front', express.static(path.join(__dirname, 'Editor Front'), { maxAge: '1d' }));

// ─── AUTHENTICATION ───────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'workers-secret-2024';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'elite2024';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Manca token' });
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token non valido' });
  }
};

app.post(['/api/login', '/login'], (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, JWT_SECRET);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Password errata' });
  }
});

// ─── SALVA FOTO MEMBRO ────────────────────────────────────────────────────────
app.post(['/api/save-photo', '/save-photo'], authenticate, (req, res) => {
  const { memberId, dataUrl } = req.body;
  if (!memberId || !dataUrl) return res.status(400).json({ error: 'Dati mancanti' });
  try {
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const filePath = path.join(UPLOADS_DIR, `${memberId}.jpg`);
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
    console.log(`📸 Foto salvata: ${memberId}.jpg`);
    res.json({ success: true, url: `/uploads/${memberId}.jpg` });
  } catch (err) {
    console.error('Photo save error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── CARICA TUTTE LE FOTO ─────────────────────────────────────────────────────
app.get(['/api/get-photos', '/get-photos'], (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    const photos = {};
    files.forEach(f => {
      if (f.endsWith('.jpg')) {
        const id = f.replace('.jpg', '');
        photos[id] = `/uploads/${f}`;
      }
    });
    res.json(photos);
  } catch (err) {
    res.json({});
  }
});

// ─── LOGICA ADMIN ─────────────────────────────────────────────────────────────
app.get(['/api/admin-logic', '/admin-logic'], authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'api', 'admin-logic.js'));
});

// ─── SALVA/CARICA CONTENUTI (LAYOUT) ──────────────────────────────────────────
app.post(['/api/save-content', '/save-content'], authenticate, (req, res) => {
  try {
    fs.writeFileSync('./content.json', JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get(['/api/get-content', '/get-content'], (req, res) => {
  try {
    if (fs.existsSync('./content.json')) {
      const data = fs.readFileSync('./content.json', 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json({});
    }
  } catch (err) {
    res.json({});
  }
});

// ─── AVVIA SERVER HTTPS ───────────────────────────────────────────────────────
const EDITOR_FRONT_DIR = path.join(__dirname, 'Editor Front');
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

const PORT = 8080;
const sslOptions = {
  key:  fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`✅ Server HTTPS avviato su https://localhost:${PORT}`);
});
