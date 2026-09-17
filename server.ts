import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { createExpressApp } from './server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = await createExpressApp();
  const PORT = 3000;

  // Serve static assets from dist/
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));

  // Catch-all for React Router SPA
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CPMS Server] College Placement Management System running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CPMS Server] Fatal startup error:', err);
  process.exit(1);
});
