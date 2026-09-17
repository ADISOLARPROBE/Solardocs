import http from 'http';
import next from 'next';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';

const dev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log(`[SolarDocs] Preparing Next.js application (mode: ${dev ? 'development' : 'production'})...`);

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url || '/', `http://${host}`);

    // Health check endpoint for Railway, Docker, or monitoring services
    if (parsedUrl.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'SolarDocs', port, mode: dev ? 'development' : 'production' }));
      return;
    }

    // Pass all other HTTP traffic to Next.js request handler
    handle(req, res);
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (conn, req, docName) => {
    conn.on('error', (err) => {
      console.error('[SolarDocs WS] Connection error:', err.message);
    });
    setupWSConnection(conn, req, { docName });
  });

  server.on('upgrade', (req, socket, head) => {
    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url || '/', `http://${host}`);
    const pathname = parsedUrl.pathname || '';

    // Route Yjs WebSocket connections through /yjs
    if (pathname === '/yjs' || pathname.startsWith('/yjs/')) {
      const docName =
        pathname.slice('/yjs'.length).replace(/^\//, '').split('?')[0] ||
        parsedUrl.searchParams.get('room') ||
        'default';

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, docName);
      });
    } else if (!dev) {
      // In production, destroy unauthorized non-/yjs WebSocket upgrade requests
      socket.destroy();
    }
  });

  server.on('error', (err) => {
    console.error('[SolarDocs Server] Error:', err);
  });

  const gracefulShutdown = () => {
    console.log('[SolarDocs] Closing unified server...');
    wss.close(() => {
      server.close(() => {
        console.log('[SolarDocs] Server stopped.');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  server.listen(port, hostname, () => {
    console.log(`[SolarDocs] Unified server listening on http://${hostname}:${port} (mode: ${dev ? 'dev' : 'prod'})`);
    console.log(`[SolarDocs] Yjs WebSocket collaboration endpoint active at ws://${hostname}:${port}/yjs`);
  });
}).catch((err) => {
  console.error('[SolarDocs] Failed to start server:', err);
  process.exit(1);
});
