// The Midnight Gallery — tiny static server for local playtesting.
// Serves game/ on port 8080 with correct MIME types, no dependencies.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'game');
const port = Number(process.env.PORT ?? 8080);
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const safe = normalize(path).replace(/^(\.\.[/\\])+/, '');
    const file = join(root, safe);
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }
    const body = readFileSync(file);
    res.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(String(err));
  }
});

server.listen(port, () => {
  console.log(`[midnight-gallery] serving ${root} at http://localhost:${port}/`);
});
