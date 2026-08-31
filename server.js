import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const port = Number(process.env.PORT || 3000);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function serveFile(urlPath, res) {
  const requested = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const filePath = path.resolve(publicDir, requested);
  if (!filePath.startsWith(publicDir + path.sep)) return sendJson(res, 403, { error: 'Forbidden' });

  try {
    const data = await fs.readFile(filePath);
    const type = mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: 'Not found' });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, app: 'IndoMail', version: '0.1.0' });
    }

    if (req.method !== 'GET') {
      return sendJson(res, 405, { error: 'Method not allowed' });
    }

    return serveFile(url.pathname, res);
  } catch (error) {
    console.error('Server error:', error);
    return sendJson(res, 500, { error: 'Internal server error' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`IndoMail running at http://localhost:${port}`);
});
