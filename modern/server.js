// Conscenery — modern port (Node + SQLite, zero dependencies)
//
// Faithful reimplementation of the December 2018 PHP/MySQL original in
// ../legacy-php/. Same product behaviour:
//   * register / login (alphanumeric 6-30 chars, email validation)
//   * Demo / Demo login button that autofills and submits, Generate Demo Account
//   * Stream gated to connected contacts, self right / received left
//   * posts with expiry 30min / 1h / 6h / 12h / 24h / 48h (default 48h in the
//     form, 1h server fall-through), lazily purged on load, live countdown,
//     client refresh every 5s (as sys.js did)
//   * contacts: add by username, pending accept/cancel, block/unblock/remove
//   * direct messages per contact, delete own messages
//   * new users auto-connected to Demo, so the feed is seeded, not empty
//
// What deliberately differs from the 2018 code (fixes, not regressions):
//   * passwords are scrypt-hashed — never stored in plaintext (the 2018
//     register.php used password_hash, but login.php also accepted a plaintext
//     match; this port only ever verifies a hash)
//   * no GET side-effects: accept / block / delete are POSTs with a session
//   * prepared statements everywhere (no string-built SQL)
//   * a change-password endpoint (the original had no forgot/reset flow)
//   * the DM query is correct — the original stream_messages.php had an
//     AND/OR precedence bug that ignored the STREAM filter on one branch
//   * uploads stay disabled, as in the shipped main.php (both file inputs
//     are commented out there), so this port is text-only
//
// Run:  node server.js            (or: npm start)
//       http://localhost:3000    (PORT env to change; CONSCENERY_DB for the db path)
// The SQLite file is created on first run and seeded with Demo/Demo and
// robert/robert, connected to each other, plus the two demo.png posts.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.CONSCENERY_DB || path.join(__dirname, 'conscenery.db');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DEMO_PNG = path.join(__dirname, '..', 'legacy-php', 'demo.png');

// Expiry options, mirroring post.php: 1=30min, 2=1h (server default),
// 3=6h, 4=12h, 5=24h, 6=48h.
const EXPIRY_SECONDS = { 1: 30 * 60, 2: 3600, 3: 6 * 3600, 4: 12 * 3600, 5: 24 * 3600, 6: 48 * 3600 };

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    active TEXT, joined TEXT NOT NULL, status TEXT NOT NULL DEFAULT '0'
  );
  CREATE TABLE IF NOT EXISTS network (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1 INTEGER NOT NULL, user2 INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT '1', direction TEXT
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    src_id INTEGER NOT NULL, dest_id INTEGER,
    stream INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL, post_time TEXT NOT NULL, expiry_time TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created TEXT NOT NULL
  );
`);

// ---- passwords: scrypt, never plaintext -----------------------------------
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}
function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const hash = crypto.scryptSync(password, Buffer.from(parts[1], 'hex'), 64);
    return crypto.timingSafeEqual(hash, Buffer.from(parts[2], 'hex'));
  } catch { return false; }
}

// ---- seed: Demo + robert, connected, with the demo.png posts --------------
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count > 0) return;
  const now = new Date();
  const iso = (d) => d.toISOString().replace('T', ' ').slice(0, 19);
  const joined = iso(now);
  const expiry = iso(new Date(now.getTime() + 48 * 3600 * 1000));
  const insertUser = db.prepare(
    'INSERT INTO users (username, email, password_hash, active, joined) VALUES (?, ?, ?, ?, ?)');
  const demo = insertUser.run('Demo', 'demo@example.com', hashPassword('Demo'), joined, joined);
  const robert = insertUser.run('robert', 'robert@example.com', hashPassword('robert'), joined, joined);
  db.prepare('INSERT INTO network (user1, user2, status) VALUES (?, ?, ?)')
    .run(robert.lastInsertRowid, demo.lastInsertRowid, '0');
  const post = db.prepare(
    'INSERT INTO messages (src_id, dest_id, stream, content, post_time, expiry_time) VALUES (?, NULL, 1, ?, ?, ?)');
  post.run(demo.lastInsertRowid, 'Hello', joined, expiry);
  post.run(robert.lastInsertRowid, 'This is awesome!', joined, expiry);
  console.log('Seeded Demo/Demo and robert/robert with the demo.png posts.');
}
seedIfEmpty();

// ---- helpers ---------------------------------------------------------------
function nowIso() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }
function purgeExpired() {
  db.prepare('DELETE FROM messages WHERE expiry_time <= ?').run(nowIso());
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function linkify(text) {
  const safe = escapeHtml(text);
  return safe.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}
// Port of stream_messages.php time2str(): relative past/future phrasing.
function time2str(ts) {
  const t = new Date(ts.replace(' ', 'T') + 'Z').getTime();
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff === 0) return 'now';
  if (diff > 0) {
    const dayDiff = Math.floor(diff / 86400);
    if (dayDiff === 0) {
      if (diff < 60) return 'just now';
      if (diff < 120) return '1 minute ago';
      if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
      if (diff < 7200) return '1 hour ago';
      return `${Math.floor(diff / 3600)} hours ago`;
    }
    if (dayDiff === 1) return 'Yesterday';
    if (dayDiff < 7) return `${dayDiff} days ago`;
    if (dayDiff < 31) return `${Math.ceil(dayDiff / 7)} weeks ago`;
    if (dayDiff < 60) return 'last month';
    return new Date(t).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  const adiff = Math.abs(diff);
  const dayDiff = Math.floor(adiff / 86400);
  if (dayDiff === 0) {
    if (adiff < 120) return 'in a minute';
    if (adiff < 3600) return `in ${Math.floor(adiff / 60)} minutes`;
    if (adiff < 7200) return 'in an hour';
    return `in ${Math.floor(adiff / 3600)} hours`;
  }
  if (dayDiff === 1) return 'Tomorrow';
  return new Date(t).toLocaleDateString('en-US', { weekday: 'long' });
}
function expiryLabel(expiryTime) {
  const ms = new Date(expiryTime.replace(' ', 'T') + 'Z').getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `expires in ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `expires in ${hours}h ${mins % 60}m`;
  return `expires in ${Math.floor(hours / 24)}d ${hours % 24}h`;
}

const ALNUM = /^[A-Za-z0-9]+$/;
function validUserPass(username, password) {
  if (!username || !password) return 'Username and password are required.';
  if (!ALNUM.test(username) || !ALNUM.test(password)) return 'Username and password must be alphanumeric.';
  if (username.length < 6 || password.length < 6) return 'Username and password must be at least 6 characters.';
  if (username.length > 30 || password.length > 30) return 'Length exceeded.';
  return null;
}
function validEmail(email) {
  return typeof email === 'string' && email.length <= 30 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSessionUser(req) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/(?:^|;\s*)conscenery_session=([A-Za-z0-9]+)/);
  if (!m) return null;
  const row = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(m[1]);
  if (!row) return null;
  return db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(row.user_id) || null;
}
function contactIds(userId) {
  const rows = db.prepare(
    `SELECT user1, user2 FROM network WHERE status = '0' AND (user1 = ? OR user2 = ?)`).all(userId, userId);
  const ids = new Set([userId]);
  for (const r of rows) ids.add(r.user1 === userId ? r.user2 : r.user1);
  return [...ids];
}
function renderMessages(rows, meId) {
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    mine: r.src_id === meId,
    html: linkify(r.content),
    posted: time2str(r.post_time),
    expires: expiryLabel(r.expiry_time),
    expiryTime: r.expiry_time,
  }));
}

// ---- HTTP plumbing ---------------------------------------------------------
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 100000) req.destroy(); });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.gif': 'image/gif' };

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;

    // --- static assets ---
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      const html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': html.length });
      return res.end(html);
    }
    if (req.method === 'GET' && (pathname === '/styles.css' || pathname === '/app.js')) {
      const file = fs.readFileSync(path.join(PUBLIC_DIR, pathname));
      res.writeHead(200, { 'Content-Type': MIME[path.extname(pathname)], 'Content-Length': file.length });
      return res.end(file);
    }
    if (req.method === 'GET' && pathname === '/demo.png') {
      // The screenshot lives once, in legacy-php/ — no duplicate binary here.
      if (!fs.existsSync(DEMO_PNG)) return sendJson(res, 404, { ok: false, error: 'Demo screenshot not present in this checkout (see legacy-php/demo.png).' });
      const file = fs.readFileSync(DEMO_PNG);
      res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': file.length });
      return res.end(file);
    }

    // --- API ---
    if (!pathname.startsWith('/api/')) return sendJson(res, 404, { ok: false, error: 'Not found' });
    const me = getSessionUser(req);
    const needAuth = !['/api/login', '/api/register'].includes(pathname);
    if (needAuth && !me) return sendJson(res, 401, { ok: false, error: 'Logged out' });

    if (pathname === '/api/register' && req.method === 'POST') {
      const { username, email, password } = await readBody(req);
      const err = validUserPass(username, password) || (!validEmail(email) ? 'Not a valid email address.' : null);
      if (err) return sendJson(res, 400, { ok: false, error: err });
      const clash = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, String(email).toLowerCase());
      if (clash) return sendJson(res, 400, { ok: false, error: 'Username/Email already registered' });
      const joined = nowIso();
      const info = db.prepare('INSERT INTO users (username, email, password_hash, active, joined) VALUES (?, ?, ?, ?, ?)')
        .run(username, String(email).toLowerCase(), hashPassword(password), joined, joined);
      // As in register.php: every new user is auto-connected to Demo.
      const demo = db.prepare("SELECT id FROM users WHERE username = 'Demo'").get();
      if (demo) db.prepare('INSERT INTO network (user1, user2, status) VALUES (?, ?, ?)').run(info.lastInsertRowid, demo.id, '0');
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/login' && req.method === 'POST') {
      const { username, password } = await readBody(req);
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '');
      if (!user || !verifyPassword(password || '', user.password_hash)) {
        return sendJson(res, 401, { ok: false, error: 'Your Login Name or Password is invalid' });
      }
      const token = crypto.randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions (token, user_id, created) VALUES (?, ?, ?)').run(token, user.id, nowIso());
      db.prepare('UPDATE users SET active = ? WHERE id = ?').run(nowIso(), user.id);
      res.setHeader('Set-Cookie', `conscenery_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`);
      return sendJson(res, 200, { ok: true, user: { id: user.id, username: user.username, email: user.email } });
    }

    if (pathname === '/api/logout' && req.method === 'POST') {
      const cookie = req.headers.cookie || '';
      const m = cookie.match(/conscenery_session=([A-Za-z0-9]+)/);
      if (m) db.prepare('DELETE FROM sessions WHERE token = ?').run(m[1]);
      res.setHeader('Set-Cookie', 'conscenery_session=; HttpOnly; Path=/; Max-Age=0');
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/me' && req.method === 'GET') return sendJson(res, 200, { ok: true, user: me });

    // Change password — new in this port (the original had no reset flow).
    if (pathname === '/api/change-password' && req.method === 'POST') {
      const { currentPassword, newPassword } = await readBody(req);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(me.id);
      if (!verifyPassword(currentPassword || '', user.password_hash)) {
        return sendJson(res, 401, { ok: false, error: 'Current password is incorrect.' });
      }
      const err = validUserPass(me.username, newPassword);
      if (err) return sendJson(res, 400, { ok: false, error: err });
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(newPassword), me.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(me.id);
      res.setHeader('Set-Cookie', 'conscenery_session=; HttpOnly; Path=/; Max-Age=0');
      return sendJson(res, 200, { ok: true, message: 'Password changed. Please log in again.' });
    }

    if (pathname === '/api/stream' && req.method === 'GET') {
      purgeExpired();
      const ids = contactIds(me.id);
      const rows = db.prepare(
        `SELECT m.*, u.username FROM messages m JOIN users u ON u.id = m.src_id
         WHERE m.stream = 1 AND m.src_id IN (${ids.map(() => '?').join(',')}) ORDER BY m.id`).all(...ids);
      return sendJson(res, 200, { ok: true, messages: renderMessages(rows, me.id) });
    }

    if (pathname === '/api/post' && req.method === 'POST') {
      const { text, timeSelection, destId } = await readBody(req);
      if (typeof text !== 'string' || !text.trim()) return sendJson(res, 400, { ok: false, error: 'Text required' });
      if (text.length > 500) return sendJson(res, 400, { ok: false, error: 'Length exceeded' });
      const seconds = EXPIRY_SECONDS[String(timeSelection)] || EXPIRY_SECONDS[2];
      const now = new Date();
      const expiry = new Date(now.getTime() + seconds * 1000).toISOString().replace('T', ' ').slice(0, 19);
      if (destId) {
        const peer = Number(destId);
        const connected = db.prepare(
          `SELECT id FROM network WHERE status = '0' AND ((user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?))`)
          .get(me.id, peer, peer, me.id);
        if (!connected) return sendJson(res, 403, { ok: false, error: 'Not connected to that user' });
        db.prepare('INSERT INTO messages (src_id, dest_id, stream, content, post_time, expiry_time) VALUES (?, ?, 0, ?, ?, ?)')
          .run(me.id, peer, text, nowIso(), expiry);
      } else {
        db.prepare('INSERT INTO messages (src_id, dest_id, stream, content, post_time, expiry_time) VALUES (?, NULL, 1, ?, ?, ?)')
          .run(me.id, text, nowIso(), expiry);
      }
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/delete' && req.method === 'POST') {
      const { id } = await readBody(req);
      const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(Number(id));
      if (!row || row.src_id !== me.id) return sendJson(res, 403, { ok: false, error: 'Not your message' });
      db.prepare('DELETE FROM messages WHERE id = ?').run(Number(id));
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/contacts' && req.method === 'GET') {
      const connected = db.prepare(
        `SELECT u.id, u.username FROM network n JOIN users u ON u.id = CASE WHEN n.user1 = ? THEN n.user2 ELSE n.user1 END
         WHERE n.status = '0' AND (n.user1 = ? OR n.user2 = ?) ORDER BY u.username`).all(me.id, me.id, me.id);
      const pending = db.prepare(
        `SELECT n.id AS network_id, n.user1, n.user2, n.status, n.direction, u.id AS other_id, u.username AS other
         FROM network n JOIN users u ON u.id = CASE WHEN n.user1 = ? THEN n.user2 ELSE n.user1 END
         WHERE n.status <> '0' AND (n.user1 = ? OR n.user2 = ?) ORDER BY u.username`).all(me.id, me.id, me.id);
      return sendJson(res, 200, {
        ok: true,
        connected,
        pending: pending.map((r) => ({
          otherId: r.other_id, other: r.other, status: r.status,
          incoming: r.status === '1' && r.user1 !== me.id,
          blockedByMe: r.status === '2' && ((r.user1 === me.id && r.direction === '0') || (r.user2 === me.id && r.direction === '1')),
        })),
      });
    }

    if (pathname === '/api/contact-request' && req.method === 'POST') {
      const { username } = await readBody(req);
      const other = db.prepare('SELECT id FROM users WHERE username = ?').get(username || '');
      if (!other) return sendJson(res, 400, { ok: false, error: 'User not found' });
      if (other.id === me.id) return sendJson(res, 400, { ok: false, error: 'User not found' });
      const existing = db.prepare(
        `SELECT id FROM network WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)`).get(me.id, other.id, other.id, me.id);
      if (!existing) db.prepare('INSERT INTO network (user1, user2, status) VALUES (?, ?, ?)').run(me.id, other.id, '1');
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/contact-action' && req.method === 'POST') {
      const { userId, action } = await readBody(req);
      const peer = Number(userId);
      const row = db.prepare(
        `SELECT * FROM network WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)`).get(me.id, peer, peer, me.id);
      if (!row) return sendJson(res, 400, { ok: false, error: 'No connection with that user' });
      if (action === 'accept') {
        db.prepare('UPDATE network SET status = ? WHERE id = ?').run('0', row.id);
      } else if (action === 'remove' || action === 'unblock') {
        db.prepare('DELETE FROM network WHERE id = ?').run(row.id);
      } else if (action === 'block') {
        const direction = row.user1 === me.id ? '0' : '1';
        db.prepare("UPDATE network SET status = '2', direction = ? WHERE id = ?").run(direction, row.id);
      } else return sendJson(res, 400, { ok: false, error: 'Unknown action' });
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/dm' && req.method === 'GET') {
      const peer = Number(url.searchParams.get('userId'));
      purgeExpired();
      const rows = db.prepare(
        `SELECT m.*, u.username FROM messages m JOIN users u ON u.id = m.src_id
         WHERE m.stream = 0 AND ((m.src_id = ? AND m.dest_id = ?) OR (m.src_id = ? AND m.dest_id = ?))
         ORDER BY m.id`).all(me.id, peer, peer, me.id);
      return sendJson(res, 200, { ok: true, messages: renderMessages(rows, me.id) });
    }

    return sendJson(res, 404, { ok: false, error: 'Not found' });
  } catch (e) {
    console.error(e);
    return sendJson(res, 500, { ok: false, error: 'Server error' });
  }
});

server.listen(PORT, () => console.log(`Conscenery (modern) running at http://localhost:${PORT}`));
