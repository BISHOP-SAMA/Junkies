import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';
import { setupVite, serveStatic, log } from '../server/vite';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let resSent = false;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") && !resSent) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
      resSent = true;
    }
  });

  next();
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const server = createServer(app);
  await registerRoutes(server, app);

  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return app(req, res);
}
