// Mini Discord - servidor de sinalização (zero dependências, só Node 16+)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.APP_PASSWORD || ''; // senha opcional (recomendado ao publicar)
const MAX_PEERS = parseInt(process.env.MAX_PEERS || '4', 10);

const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
if (process.env.TURN_URL) {
  ICE.push({
    urls: process.env.TURN_URL.split(','),
    username: process.env.TURN_USER || '',
    credential: process.env.TURN_PASS || '',
  });
}

const rooms = new Map(); // sala -> Map(id -> { res, name })
const ID_RE = /^[\w-]{1,40}$/;

const json = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
};
const sse = (res, event, data) => {
  try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch {}
};
const broadcast = (room, exceptId, event, data) => {
  for (const [id, p] of room) if (id !== exceptId) sse(p.res, event, data);
};
const checkAccess = (q) => {
  if (!ID_RE.test(q.get('room') || '')) return 'Código da sala inválido (use letras, números, - ou _).';
  if (PASSWORD && q.get('pw') !== PASSWORD) return 'Senha incorreta.';
  return null;
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const q = url.searchParams;

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    fs.readFile(path.join(__dirname, 'index.html'), (err, buf) => {
      if (err) return json(res, 500, { error: 'index.html não encontrado' });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(buf);
    });
    return;
  }

  const STATIC = {
    '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json'],
    '/sw.js': ['sw.js', 'application/javascript'],
    '/icon-192.png': ['icon-192.png', 'image/png'],
    '/icon-512.png': ['icon-512.png', 'image/png'],
  };
  if (req.method === 'GET' && STATIC[url.pathname]) {
    const [file, type] = STATIC[url.pathname];
    fs.readFile(path.join(__dirname, file), (err, buf) => {
      if (err) return json(res, 404, { error: 'não encontrado' });
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
      res.end(buf);
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/config') {
    return json(res, 200, { iceServers: ICE, needsPassword: !!PASSWORD });
  }

  if (req.method === 'GET' && url.pathname === '/check') {
    const err = checkAccess(q);
    if (err) return json(res, 200, { error: err });
    const room = rooms.get(q.get('room'));
    if (room && room.size >= MAX_PEERS) return json(res, 200, { error: 'Sala cheia.' });
    return json(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/events') {
    const err = checkAccess(q);
    if (err) return json(res, 401, { error: err });
    const rn = q.get('room');
    const id = q.get('id') || '';
    const name = (q.get('name') || 'Visitante').slice(0, 30);
    if (!ID_RE.test(id)) return json(res, 400, { error: 'id inválido' });

    let room = rooms.get(rn);
    if (!room) { room = new Map(); rooms.set(rn, room); }
    const old = room.get(id);
    if (!old && room.size >= MAX_PEERS) return json(res, 409, { error: 'Sala cheia.' });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 2000\n\n');
    if (old) { try { old.res.end(); } catch {} }

    const me = { res, name };
    room.set(id, me);
    sse(res, 'welcome', {
      peers: [...room].filter(([k]) => k !== id).map(([k, v]) => ({ id: k, name: v.name })),
    });
    if (!old) broadcast(room, id, 'peer-joined', { id, name });

    const ka = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 20000);
    req.on('close', () => {
      clearInterval(ka);
      if (room.get(id) === me) {
        room.delete(id);
        broadcast(room, id, 'peer-left', { id });
        if (!room.size) rooms.delete(rn);
      }
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/send') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 200000) req.destroy(); });
    req.on('end', () => {
      try {
        const { room: rn, id, to, event, data } = JSON.parse(body);
        const room = rooms.get(rn);
        const sender = room && room.get(id);
        if (!sender) return json(res, 404, { error: 'fora da sala' });
        if (!['signal', 'state', 'chat'].includes(event)) return json(res, 400, { error: 'evento inválido' });
        const payload = { from: id, name: sender.name, data };
        if (to) {
          const target = room.get(to);
          if (target) sse(target.res, event, payload);
        } else {
          broadcast(room, id, event, payload);
        }
        json(res, 200, { ok: true });
      } catch {
        json(res, 400, { error: 'requisição inválida' });
      }
    });
    return;
  }

  json(res, 404, { error: 'não encontrado' });
});

server.listen(PORT, () => console.log(`Mini Discord rodando em http://localhost:${PORT}`));
