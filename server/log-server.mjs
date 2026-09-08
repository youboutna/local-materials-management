/**
 * log-server.mjs — réception et externalisation des logs applicatifs.
 *
 * Endpoint : POST /api/logs/export  { logs: LogEntry[], sentAt: string }
 * Écriture : $LOG_DIR/YYYY-MM-DD.log (JSONL) et $LOG_DIR/errors.log
 * Santé    : GET /health
 *
 * Variables : LOG_DIR (défaut /var/logs/app), LOG_PORT (défaut 3002),
 *             LOG_RETENTION_DAYS (défaut 30), NODE_ENV.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const LOG_DIR = process.env.LOG_DIR || '/var/logs/app';
const PORT = Number(process.env.LOG_PORT || 3002);
const RETENTION_DAYS = Number(process.env.LOG_RETENTION_DAYS || 30);

fs.mkdirSync(LOG_DIR, { recursive: true });

const today = () => new Date().toISOString().slice(0, 10);

const append = (file, lines) => {
  if (lines.length === 0) return;
  fs.appendFileSync(path.join(LOG_DIR, file), `${lines.join('\n')}\n`, 'utf-8');
};

const purgeOldFiles = () => {
  const limit = Date.now() - RETENTION_DAYS * 86_400_000;
  for (const name of fs.readdirSync(LOG_DIR)) {
    if (!/^\d{4}-\d{2}-\d{2}\.log$/.test(name)) continue;
    const stamp = Date.parse(name.slice(0, 10));
    if (Number.isFinite(stamp) && stamp < limit) fs.rmSync(path.join(LOG_DIR, name));
  }
};

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
};

const server = http.createServer((req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') return res.writeHead(204).end();

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', logDir: LOG_DIR }));
  }

  if (req.method === 'POST' && req.url?.startsWith('/api/logs/export')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) req.destroy();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const logs = Array.isArray(payload.logs) ? payload.logs : [];
        const lines = logs.map((entry) => JSON.stringify({ receivedAt: new Date().toISOString(), ...entry }));
        append(`${today()}.log`, lines);
        append(
          'errors.log',
          logs
            .filter((entry) => entry.level === 'error' || entry.level === 'critical')
            .map((entry) => JSON.stringify({ receivedAt: new Date().toISOString(), ...entry })),
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ accepted: logs.length }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid payload' }));
      }
    });
    return undefined;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ error: 'not found' }));
});

setInterval(purgeOldFiles, 6 * 3600_000).unref();
purgeOldFiles();

server.listen(PORT, () => {
  process.stdout.write(`[log-server] listening on ${PORT}, dir=${LOG_DIR}\n`);
});
