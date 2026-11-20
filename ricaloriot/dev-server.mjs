// Local preview: `npm run dev` -> http://localhost:5173/?k=123456
// Serves public/ and runs the same API handlers against a local JSON file.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./public', import.meta.url));
process.env.RK_LOCAL_STORE ||= fileURLToPath(new URL('./.dev-state.json', import.meta.url));
process.env.RICALORIOT_CODE ||= '123456';
const PORT = Number(process.env.PORT || 5173);

const api = {
  '/api/state': (await import('./api/state.js')).default,
  '/api/manifest': (await import('./api/manifest.js')).default,
};
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8',
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    try {
      const handler = api[url.pathname];
      if (handler) {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const out = await handler.fetch(
          new Request(url, {
            method: req.method,
            headers: req.headers,
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
          }),
        );
        res.writeHead(out.status, Object.fromEntries(out.headers));
        return res.end(Buffer.from(await out.arrayBuffer()));
      }
      const path = normalize(url.pathname === '/' ? '/index.html' : url.pathname);
      const body = await readFile(join(root, path));
      res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  })
  .listen(PORT, () => console.log(`Ricaloriot dev: http://localhost:${PORT}/?k=${process.env.RICALORIOT_CODE}`));
